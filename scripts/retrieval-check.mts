/** What does retrieval actually return for real questions? */
import { retrieve } from "../src/lib/chat-retrieval";

const QUESTIONS = [
  "What do you actually do?",
  "how much does it cost",
  "our AI pilot is stuck",
  "which industries have you worked in",
  "can I stop halfway through",
  "do you do cloud cost optimisation",
  "how do I contact you",
  "what happens to my data",
  "what is the airspeed velocity of an unladen swallow",
  "do you sell insurance",
];

for (const question of QUESTIONS) {
  const result = await retrieve(question);
  if (result.needsHuman) {
    console.log(`\nQ: ${question}\n   -> no confident match, offers a person`);
    continue;
  }
  console.log(`\nQ: ${question}`);
  for (const answer of result.answers) {
    console.log(`   [${answer.score}] ${answer.topic}  -> ${answer.href}`);
    console.log(`        ${answer.text.slice(0, 96)}...`);
  }
}
