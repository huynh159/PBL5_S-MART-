import { PrismaClient, OrderStatus, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');
  const hash = await bcrypt.hash('123456', 10);

  // Reset data theo thứ tự quan hệ
  await prisma.orderItem.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.review.deleteMany();
  await prisma.message.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // Users: 10 bản ghi
  const usersPayload = [
    {
      email: 'admin@smart.com',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      isVerified: true,
      address: '1 Nguyen Van Linh, Da Nang',
      phone: '0901000001',
      staffCode: 'ADM001',
      position: 'Administrator',
      department: 'Management',
    },
    {
      email: 'staff1@smart.com',
      role: UserRole.STAFF,
      status: UserStatus.ACTIVE,
      isVerified: true,
      address: '2 Tran Phu, Da Nang',
      phone: '0901000002',
      staffCode: 'STF001',
      position: 'Sales Staff',
      department: 'Sales',
    },
    ...Array.from({ length: 8 }, (_, i) => ({
      email: i === 0 ? 'customer@gmail.com' : i === 1 ? 'user2@gmail.com' : `customer${i + 1}@gmail.com`,
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
      isVerified: true,
      address: `${10 + i} Le Loi, Da Nang`,
      phone: `09020000${String(i + 1).padStart(2, '0')}`,
      accumulatedPoints: (i + 1) * 10,
    })),
  ];

  const users = [];
  for (const u of usersPayload) {
    users.push(
      await prisma.user.create({
        data: {
          ...u,
          password: hash,
        },
      }),
    );
  }

  const admin = users[0];
  const customerUsers = users.filter((u) => u.role === UserRole.CUSTOMER);
  console.log(`✅ Users: ${users.length}`);

  // Categories: 10 bản ghi
  const categoryNames = [
    'Giay Chay Bo',
    'Giay Da Bong',
    'Ao The Thao',
    'Quan The Thao',
    'Phu Kien Tap Gym',
    'Balo The Thao',
    'Bong Da',
    'Vot Cau Long',
    'Do Boi',
    'Yoga & Fitness',
  ];
  const categories = [];
  for (const name of categoryNames) {
    categories.push(
      await prisma.category.create({
        data: {
          name,
          description: `Danh muc ${name} cho Sport Shop`,
        },
      }),
    );
  }
  console.log(`✅ Categories: ${categories.length}`);

  // Products: 10 bản ghi
  const products = [];
  for (let i = 0; i < 10; i += 1) {
    const category = categories[i % categories.length];
    const basePrice = 300000 + i * 120000;
    products.push(
      await prisma.product.create({
        data: {
          sku: `SP-${String(i + 1).padStart(3, '0')}`,
          name: `San pham the thao ${i + 1}`,
          price: basePrice,
          salePrice: i % 2 === 0 ? basePrice - 50000 : null,
          description: `Mo ta san pham the thao ${i + 1}`,
          stock: 60 + i * 5,
          imageUrl: `https://picsum.photos/seed/sport-${i + 1}/800/800`,
          brand: i % 2 === 0 ? 'Nike' : 'Adidas',
          status: 'ACTIVE',
          variations: JSON.stringify([
            { size: 'M', color: 'Black', stock: 20 + i },
            { size: 'L', color: 'White', stock: 15 + i },
          ]),
          categoryId: category.id,
        },
      }),
    );
  }
  console.log(`✅ Products: ${products.length}`);

  // Product images: 10 bản ghi
  for (let i = 0; i < 10; i += 1) {
    await prisma.productImage.create({
      data: {
        productId: products[i].id,
        imageUrl: `https://picsum.photos/seed/product-image-${i + 1}/900/900`,
      },
    });
  }
  console.log('✅ Product images: 10');

  // Coupons: 10 bản ghi
  for (let i = 0; i < 10; i += 1) {
    await prisma.coupon.create({
      data: {
        code: i === 0 ? 'WELCOME10' : i === 1 ? 'SPORT20' : `DEAL${String(i + 1).padStart(2, '0')}`,
        discountPercent: 5 + i * 2,
        expiryDate: new Date(`2026-12-${String((i % 28) + 1).padStart(2, '0')}`),
        isActive: true,
      },
    });
  }
  const coupons = await prisma.coupon.findMany({ orderBy: { id: 'asc' }, take: 10 });
  console.log(`✅ Coupons: ${coupons.length}`);

  // Orders + OrderItems: mỗi bảng 10 bản ghi
  const statuses: OrderStatus[] = [
    OrderStatus.PENDING,
    OrderStatus.CONFIRMED,
    OrderStatus.SHIPPING,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
  ];
  const paymentMethods = ['COD', 'VNPAY'];
  const createdOrders = [];

  for (let i = 0; i < 10; i += 1) {
    const customer = customerUsers[i % customerUsers.length];
    const product = products[i % products.length];
    const quantity = (i % 3) + 1;
    const orderTotal = (product.salePrice ?? product.price) * quantity;

    const order = await prisma.order.create({
      data: {
        userId: customer.id,
        total: orderTotal,
        status: statuses[i % statuses.length],
        paymentMethod: paymentMethods[i % paymentMethods.length],
        address: customer.address ?? `${100 + i} Hai Ba Trung, Da Nang`,
        phone: customer.phone ?? `09030000${String(i + 1).padStart(2, '0')}`,
        note: `Don hang mau ${i + 1}`,
        couponId: i % 2 === 0 ? coupons[i % coupons.length].id : null,
      },
    });
    createdOrders.push(order);

    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: product.id,
        quantity,
        color: i % 2 === 0 ? 'Black' : 'White',
        size: i % 2 === 0 ? 'M' : 'L',
        price: product.salePrice ?? product.price,
      },
    });
  }
  console.log('✅ Orders: 10');
  console.log('✅ Order items: 10');

  const createdOrderItems = await prisma.orderItem.findMany({ orderBy: { id: 'asc' }, take: 10 });

  // Cart items: 10 bản ghi
  for (let i = 0; i < 10; i += 1) {
    const customer = customerUsers[i % customerUsers.length];
    const product = products[(i + 2) % products.length];
    await prisma.cartItem.create({
      data: {
        userId: customer.id,
        productId: product.id,
        quantity: (i % 2) + 1,
        color: i % 2 === 0 ? 'Blue' : 'Red',
        size: i % 2 === 0 ? 'M' : 'L',
        price: product.salePrice ?? product.price,
      },
    });
  }
  console.log('✅ Cart items: 10');

  // Reviews: 10 bản ghi
  for (let i = 0; i < 10; i += 1) {
    const customer = customerUsers[i % customerUsers.length];
    const product = products[i % products.length];
    await prisma.review.create({
      data: {
        userId: customer.id,
        productId: product.id,
        rating: (i % 5) + 1,
        comment: `Danh gia mau ${i + 1} cho san pham ${product.name}`,
        images: JSON.stringify([`https://picsum.photos/seed/review-${i + 1}/600/600`]),
        variation: i % 2 === 0 ? 'M, Black' : 'L, White',
        likes: i * 2,
        orderItemId: createdOrderItems[i]?.id ?? null,
      },
    });
  }
  console.log('✅ Reviews: 10');

  // Messages: 10 bản ghi
  for (let i = 0; i < 10; i += 1) {
    const customer = customerUsers[i % customerUsers.length];
    const fromAdmin = i % 2 === 1;
    await prisma.message.create({
      data: {
        senderId: fromAdmin ? admin.id : customer.id,
        receiverId: fromAdmin ? customer.id : admin.id,
        content: fromAdmin
          ? `Shop phan hoi tin nhan ${i + 1}`
          : `Khach hang hoi thong tin san pham lan ${i + 1}`,
        status: i % 3 === 0 ? 'SEEN' : 'SENT',
      },
    });
  }
  console.log('✅ Messages: 10');

  // Notifications: 10 bản ghi
  for (let i = 0; i < 10; i += 1) {
    const customer = customerUsers[i % customerUsers.length];
    const order = createdOrders[i % createdOrders.length];
    await prisma.notification.create({
      data: {
        userId: customer.id,
        content: `Thong bao don hang #${order.id} cap nhat trang thai`,
        link: `/orders/${order.id}`,
        isRead: i % 2 === 0,
      },
    });
  }
  console.log('✅ Notifications: 10');

  console.log('\n🎉 Seed completed with valid sample data (~10 records/table).');
  console.log('   Admin:      admin@smart.com / 123456');
  console.log('   Staff:      staff1@smart.com / 123456');
  console.log('   Customer:   customer@gmail.com / 123456');
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
