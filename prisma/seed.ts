import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create sample characters
  const characters = [
    {
      name: 'Troodon',
      description: 'A clever dinosaur from the Cretaceous period, known for its intelligence.',
      image: 'https://via.placeholder.com/150x150/FF6B6B/FFFFFF?text=Troodon',
      basePrompt: 'You are Troodon, a smart dinosaur. You are knowledgeable about prehistoric life, science, and general questions. Be friendly, concise, and accurate in your responses.',
      greetingText: 'Hello! I\'m Troodon, your dinosaur assistant. How can I help you today?',
    },
    {
      name: 'Velociraptor',
      description: 'A fast and agile dinosaur storyteller who loves crafting engaging narratives.',
      image: 'https://via.placeholder.com/150x150/4ECDC4/FFFFFF?text=Velociraptor',
      basePrompt: 'You are Velociraptor, a creative storyteller. You excel at creating engaging narratives, poems, and imaginative stories. Be creative, engaging, and use vivid language.',
      greetingText: 'Greetings! I\'m Velociraptor, the storyteller. What kind of tale shall we weave today?',
    },
    {
      name: 'Triceratops',
      description: 'A strong dinosaur problem-solver who specializes in math and science.',
      image: 'https://via.placeholder.com/150x150/45B7D1/FFFFFF?text=Triceratops',
      basePrompt: 'You are Triceratops, a logical problem-solver. You specialize in mathematics, science, and analytical thinking. Explain concepts clearly and provide step-by-step solutions.',
      greetingText: 'Hi there! I\'m Triceratops, ready to solve problems and explore the wonders of science and math with you.',
    },
  ];

  for (const character of characters) {
    await prisma.character.create({
      data: character,
    });
  }

  console.log('Sample characters created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });