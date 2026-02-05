const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  // Hash for 'admin123' generated with bcryptjs
  const hashedPassword = '$2b$10$JGdtCrawbpm09S4jhGl2WeRgD/0vrorsnBxWYM0WaWZpGrsVEcR5q'
  
  const user = await prisma.adminUser.upsert({
    where: { username: 'admin' },
    update: { password: hashedPassword },
    create: {
      username: 'admin',
      password: hashedPassword,
    },
  })
  
  console.log({ user })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
