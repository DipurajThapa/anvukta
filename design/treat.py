"""
Apply the ANVUKTA image treatment: greyscale, then a duotone that maps shadows
to ink (#0A1721) and highlights to brass (#DFAE63), then a light grain.

This is the recipe documented on the Imagery board, run once at build time so
the site ships finished images rather than doing the work in the browser.

Usage:  python treat.py <in.jpg> <out.jpg> [width] [--crop W:H] [--contrast N]
                                                  [--bias 0..1] [--grain N]
"""

import sys

from PIL import Image, ImageChops, ImageEnhance, ImageOps

INK = (10, 23, 33)
SLATE = (74, 84, 94)
BRASS = (223, 174, 99)

# Three stops, not two. A straight ink->brass ramp turns every mid-tone gold and
# the whole photograph reads sepia; holding a cool slate through the middle keeps
# brass where it belongs — in the highlights only.
STOPS = ((0.0, INK), (0.62, SLATE), (1.0, BRASS))


def tritone(grey, stops=STOPS):
    """Map an L-mode image across a multi-stop ramp, one LUT per channel."""
    channels = []
    for index in range(3):
        lut = []
        for value in range(256):
            t = value / 255
            for (t0, c0), (t1, c1) in zip(stops, stops[1:]):
                if t <= t1 or t1 == stops[-1][0]:
                    span = (t1 - t0) or 1
                    k = min(1, max(0, (t - t0) / span))
                    lut.append(round(c0[index] + (c1[index] - c0[index]) * k))
                    break
        channels.append(grey.point(lut))
    return Image.merge("RGB", channels)


def add_grain(image, strength):
    """Luminance-only noise, so the duotone hue is never tinted."""
    if strength <= 0:
        return image
    noise = Image.effect_noise(image.size, strength).convert("L")
    noise_rgb = Image.merge("RGB", (noise, noise, noise))
    return ImageChops.overlay(image, noise_rgb)


def crop_to(image, ratio, bias=0.35):
    target = ratio[0] / ratio[1]
    width, height = image.size

    if width / height > target:
        new_width = round(height * target)
        left = round((width - new_width) * 0.5)
        return image.crop((left, 0, left + new_width, height))

    new_height = round(width / target)
    # Bias upward by default — facades and skylines read better from the top.
    top = round((height - new_height) * bias)
    return image.crop((0, top, width, top + new_height))


def treat(src, dst, width, ratio, contrast, bias, grain):
    image = Image.open(src).convert("RGB")

    if ratio:
        image = crop_to(image, ratio, bias)

    if image.width > width:
        image = image.resize(
            (width, round(image.height * width / image.width)), Image.LANCZOS
        )

    grey = ImageOps.grayscale(image)
    grey = ImageOps.autocontrast(grey, cutoff=(0.5, 0.5))
    grey = ImageEnhance.Contrast(grey).enhance(contrast)

    # Keep both ends off the rails: never flat black, never flat gold.
    grey = grey.point(lambda v: round(14 + v * (238 - 14) / 255))

    result = add_grain(tritone(grey), grain)
    result.save(dst, quality=84, optimize=True, progressive=True)
    print(f"{dst}  {result.width}x{result.height}")


if __name__ == "__main__":
    args = sys.argv[1:]

    def take(flag, cast, default):
        if flag in args:
            i = args.index(flag)
            value = cast(args[i + 1])
            del args[i : i + 2]
            return value
        return default

    ratio = take("--crop", lambda s: tuple(int(v) for v in s.split(":")), None)
    contrast = take("--contrast", float, 1.06)
    bias = take("--bias", float, 0.35)
    grain = take("--grain", int, 7)

    treat(
        args[0],
        args[1],
        int(args[2]) if len(args) > 2 else 1600,
        ratio,
        contrast,
        bias,
        grain,
    )
