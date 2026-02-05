
import { prisma } from './src/lib/prisma'

async function main() {
  const logs = await prisma.systemLog.findMany({
    where: { level: 'ERROR' },
    orderBy: { createdAt: 'desc' },
    take: 5
  })
  console.log(JSON.stringify(logs, null, 2))
}

main()
