const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // 1. Clean up existing data in reverse order of relationships
  console.log('Cleaning up existing database records...');
  await prisma.activityLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.auditItem.deleteMany({});
  await prisma.auditCycle.deleteMany({});
  await prisma.maintenanceRequest.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.transferRequest.deleteMany({});
  await prisma.allocation.deleteMany({});
  await prisma.asset.deleteMany({});
  await prisma.assetCategory.deleteMany({});
  
  // To avoid circular dependency foreign keys on User/Department delete, we set headIds to null first
  await prisma.department.updateMany({ data: { headId: null } });
  await prisma.user.deleteMany({});
  await prisma.department.deleteMany({});

  console.log('Database cleaned. Seeding departments...');

  // 2. Create Departments
  const deptEng = await prisma.department.create({
    data: {
      name: 'Engineering',
      status: 'ACTIVE',
    },
  });

  const deptOps = await prisma.department.create({
    data: {
      name: 'Operations',
      status: 'ACTIVE',
    },
  });

  console.log('Seeding asset categories...');

  // 3. Create Asset Categories
  const catLaptops = await prisma.assetCategory.create({
    data: {
      name: 'Laptops',
      warrantyPeriodMonths: 36,
    },
  });

  const catFurniture = await prisma.assetCategory.create({
    data: {
      name: 'Furniture',
      warrantyPeriodMonths: null,
    },
  });

  console.log('Hashing passwords and seeding users...');

  // 4. Create Users with securely hashed passwords
  const adminPasswordHash = bcrypt.hashSync('admin123', 10);
  const managerPasswordHash = bcrypt.hashSync('manager123', 10);
  const employee1PasswordHash = bcrypt.hashSync('employee123', 10);
  const employee2PasswordHash = bcrypt.hashSync('employee234', 10);

  const userAdmin = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@assetflow.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      departmentId: deptEng.id,
    },
  });

  const userManager = await prisma.user.create({
    data: {
      name: 'Asset Manager',
      email: 'manager@assetflow.com',
      passwordHash: managerPasswordHash,
      role: 'ASSET_MANAGER',
      status: 'ACTIVE',
      departmentId: deptOps.id,
    },
  });

  const userEmployee1 = await prisma.user.create({
    data: {
      name: 'Priya Patel',
      email: 'employee1@assetflow.com',
      passwordHash: employee1PasswordHash,
      role: 'EMPLOYEE',
      status: 'ACTIVE',
      departmentId: deptEng.id,
    },
  });

  const userEmployee2 = await prisma.user.create({
    data: {
      name: 'Raj Singh',
      email: 'employee2@assetflow.com',
      passwordHash: employee2PasswordHash,
      role: 'EMPLOYEE',
      status: 'ACTIVE',
      departmentId: deptOps.id,
    },
  });

  // Update Departments with Head ID to avoid circular reference on creation
  await prisma.department.update({
    where: { id: deptEng.id },
    data: { headId: userAdmin.id },
  });

  await prisma.department.update({
    where: { id: deptOps.id },
    data: { headId: userManager.id },
  });

  console.log('Seeding demo assets...');

  // 5. Create Assets
  // We use sequential tags: AF-0001, AF-0002, AF-0003, AF-0004
  const asset1 = await prisma.asset.create({
    data: {
      tag: 'AF-0001',
      name: 'MacBook Pro 16',
      serialNumber: 'SN-MBP16-001',
      acquisitionDate: new Date('2026-01-15T00:00:00.000Z'),
      acquisitionCost: 2499.99,
      condition: 'NEW',
      location: 'HQ - 4th Floor',
      isBookable: false,
      status: 'AVAILABLE',
      categoryId: catLaptops.id,
    },
  });

  const asset2 = await prisma.asset.create({
    data: {
      tag: 'AF-0002',
      name: 'Dell XPS 15',
      serialNumber: 'SN-XPS15-002',
      acquisitionDate: new Date('2026-02-20T00:00:00.000Z'),
      acquisitionCost: 1899.99,
      condition: 'GOOD',
      location: 'HQ - 3rd Floor',
      isBookable: false,
      status: 'AVAILABLE',
      categoryId: catLaptops.id,
    },
  });

  const asset3 = await prisma.asset.create({
    data: {
      tag: 'AF-0003',
      name: 'Lenovo ThinkPad X1',
      serialNumber: 'SN-TPX1-003',
      acquisitionDate: new Date('2026-03-05T00:00:00.000Z'),
      acquisitionCost: 1599.99,
      condition: 'GOOD',
      location: 'HQ - 4th Floor',
      isBookable: true, // Let's make this ThinkPad bookable for demo bookings
      status: 'AVAILABLE',
      categoryId: catLaptops.id,
    },
  });

  const asset4 = await prisma.asset.create({
    data: {
      tag: 'AF-0004',
      name: 'Ergonomic Office Chair',
      serialNumber: 'SN-CHAIR-004',
      acquisitionDate: new Date('2026-04-10T00:00:00.000Z'),
      acquisitionCost: 349.99,
      condition: 'GOOD',
      location: 'HQ - 4th Floor',
      isBookable: false,
      status: 'AVAILABLE',
      categoryId: catFurniture.id,
    },
  });

  console.log('Database seeding completed successfully.');
  console.log('Seeded:');
  console.log(`- 2 Departments`);
  console.log(`- 2 Asset Categories`);
  console.log(`- 4 Users (Admin, Manager, Employee 1, Employee 2)`);
  console.log(`- 4 Assets (3 Laptops, 1 Furniture)`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
