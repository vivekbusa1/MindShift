import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

const DEFAULT_ACTIVITIES = [
  { name: 'Wake Up', category: 'sleep', icon: 'sunrise', aliases: ['woke up', 'got up', 'wakeup'], unit: null, scoreWeight: 1.0 },
  { name: 'Sleep', category: 'sleep', icon: 'moon', aliases: ['slept', 'went to sleep', 'bedtime', 'bed'], unit: 'hours', scoreWeight: 2.0 },
  { name: 'Workout', category: 'fitness', icon: 'dumbbell', aliases: ['exercise', 'gym', 'training', 'worked out'], unit: 'min', scoreWeight: 1.5 },
  { name: 'Walk', category: 'fitness', icon: 'footprints', aliases: ['walking', 'went for walk', 'stroll'], unit: 'min', scoreWeight: 1.0 },
  { name: 'Running', category: 'fitness', icon: 'activity', aliases: ['run', 'ran', 'jogging', 'jog'], unit: 'min', scoreWeight: 1.5 },
  { name: 'Study', category: 'productivity', icon: 'book-open', aliases: ['studied', 'reading', 'read'], unit: 'min', scoreWeight: 1.5 },
  { name: 'Work', category: 'productivity', icon: 'briefcase', aliases: ['worked', 'office', 'coding', 'meeting'], unit: 'min', scoreWeight: 1.5 },
  { name: 'Water', category: 'nutrition', icon: 'droplets', aliases: ['drink water', 'drank water', 'hydration'], unit: 'glasses', scoreWeight: 0.8 },
  { name: 'Meal', category: 'nutrition', icon: 'utensils', aliases: ['ate', 'breakfast', 'lunch', 'dinner', 'food'], unit: null, scoreWeight: 0.8 },
  { name: 'Meditation', category: 'mindfulness', icon: 'brain', aliases: ['meditate', 'mindfulness', 'breathing'], unit: 'min', scoreWeight: 1.2 },
  { name: 'Gratitude', category: 'mindfulness', icon: 'heart', aliases: ['journal', 'journaling', 'grateful'], unit: null, scoreWeight: 1.0 },
];

async function main() {
  console.log('🌱 Seeding database...');

  // Seed default activities
  for (const activity of DEFAULT_ACTIVITIES) {
    await prisma.activity.upsert({
      where: { id: `default_${activity.name.toLowerCase().replace(/\s+/g, '_')}` },
      update: activity,
      create: {
        id: `default_${activity.name.toLowerCase().replace(/\s+/g, '_')}`,
        ...activity,
        isDefault: true,
        isCustom: false,
      },
    });
  }
  console.log(`✅ ${DEFAULT_ACTIVITIES.length} default activities seeded`);

  // Seed a demo user
  const demoPasswordHash = await argon2.hash('demo1234');
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@mindshift.app' },
    update: {},
    create: {
      email: 'demo@mindshift.app',
      passwordHash: demoPasswordHash,
      isEmailVerified: true,
    },
  });

  await prisma.userProfile.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      userId: demoUser.id,
      fullName: 'Demo User',
      nickname: 'Demo',
      ageGroup: '18-25',
      profession: 'Student',
      timezone: 'Asia/Kolkata',
      interests: ['health', 'fitness', 'productivity'],
    },
  });

  await prisma.userGoal.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      userId: demoUser.id,
      wakeTime: '06:30',
      bedTime: '22:30',
      sleepDurationMin: 480,
      workoutMin: 30,
      studyWorkMin: 480,
    },
  });

  await prisma.userStreak.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: { userId: demoUser.id, currentStreak: 0, longestStreak: 0, milestones: [] },
  });

  console.log(`✅ Demo user seeded: demo@mindshift.app / demo1234`);
  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
