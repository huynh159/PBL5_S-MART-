import { PrismaClient, OrderStatus, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Kiểm tra nếu đã có dữ liệu thì bỏ qua seed (tránh xoá data thật khi server restart)
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    console.log('⏭️  Database đã có dữ liệu, bỏ qua seed.');
    return;
  }

  console.log('🌱 Starting database seed (~25 records/table)...');
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

  // ═══════════════════════════════════════════════════
  // USERS: 25 bản ghi (2 Admin, 3 Staff, 20 Customer)
  // ═══════════════════════════════════════════════════
  const addresses = [
    '1 Nguyen Van Linh, Da Nang', '5 Tran Phu, Da Nang', '12 Le Loi, Da Nang',
    '45 Bach Dang, Da Nang', '78 Hai Ba Trung, Da Nang', '23 Phan Chau Trinh, Da Nang',
    '90 Nguyen Hue, HCM', '15 Le Duan, Hue', '33 Hung Vuong, Ha Noi',
    '67 Vo Nguyen Giap, Da Nang', '8 Hoang Dieu, Da Nang', '120 Dien Bien Phu, Da Nang',
    '55 Nguyen Trai, HCM', '101 Ly Tu Trong, HCM', '28 Pasteur, HCM',
    '42 Quang Trung, Da Nang', '77 Le Hong Phong, Da Nang', '19 Ngo Quyen, Ha Noi',
    '63 Ton Duc Thang, HCM', '88 Nguyen Dinh Chieu, HCM',
  ];

  const usersPayload = [
    // 2 Admins
    { email: 'admin@smart.com', role: UserRole.ADMIN, status: UserStatus.ACTIVE, isVerified: true, address: addresses[0], phone: '0901000001', staffCode: 'ADM001', position: 'Administrator', department: 'Management' },
    { email: 'admin2@smart.com', role: UserRole.ADMIN, status: UserStatus.ACTIVE, isVerified: true, address: addresses[1], phone: '0901000002', staffCode: 'ADM002', position: 'Super Admin', department: 'Management' },
    // 3 Staff
    { email: 'staff1@smart.com', role: UserRole.STAFF, status: UserStatus.ACTIVE, isVerified: true, address: addresses[2], phone: '0901000003', staffCode: 'STF001', position: 'Sales Staff', department: 'Sales' },
    { email: 'staff2@smart.com', role: UserRole.STAFF, status: UserStatus.ACTIVE, isVerified: true, address: addresses[3], phone: '0901000004', staffCode: 'STF002', position: 'Warehouse Staff', department: 'Warehouse' },
    { email: 'staff3@smart.com', role: UserRole.STAFF, status: UserStatus.ACTIVE, isVerified: true, address: addresses[4], phone: '0901000005', staffCode: 'STF003', position: 'Customer Support', department: 'Support' },
    // 20 Customers
    ...Array.from({ length: 20 }, (_, i) => ({
      email: i === 0 ? 'customer@gmail.com' : i === 1 ? 'user2@gmail.com' : `customer${i + 1}@gmail.com`,
      role: UserRole.CUSTOMER,
      status: i < 18 ? UserStatus.ACTIVE : (i === 18 ? UserStatus.INACTIVE : UserStatus.LOCKED),
      isVerified: i < 19,
      address: addresses[i % addresses.length],
      phone: `09020${String(i + 1).padStart(5, '0')}`,
      accumulatedPoints: (i + 1) * 15,
    })),
  ];

  const users = [];
  for (const u of usersPayload) {
    users.push(await prisma.user.create({ data: { ...u, password: hash } }));
  }
  const admin = users[0];
  const staffUsers = users.filter(u => u.role === UserRole.STAFF);
  const customerUsers = users.filter(u => u.role === UserRole.CUSTOMER);
  console.log(`✅ Users: ${users.length}`);

  // ═══════════════════════════════════════
  // CATEGORIES: 25 bản ghi
  // ═══════════════════════════════════════
  const categoryData = [
    { name: 'Giay Chay Bo', description: 'Giay chay bo chuyen nghiep tu Nike, Adidas, Asics' },
    { name: 'Giay Da Bong', description: 'Giay da bong san co nhan tao va san co tu nhien' },
    { name: 'Giay Bong Ro', description: 'Giay bong ro cao co va thap co' },
    { name: 'Ao The Thao Nam', description: 'Ao the thao nam thoang mat, co gian 4 chieu' },
    { name: 'Ao The Thao Nu', description: 'Ao the thao nu thoi trang, thoai mai van dong' },
    { name: 'Quan The Thao Nam', description: 'Quan short va quan dai the thao cho nam' },
    { name: 'Quan The Thao Nu', description: 'Quan legging va quan short the thao nu' },
    { name: 'Phu Kien Tap Gym', description: 'Gang tay, dai lung, day keo tap gym' },
    { name: 'Balo The Thao', description: 'Balo va tui dung do the thao' },
    { name: 'Bong Da', description: 'Bong da chinh hang tu Adidas, Nike, Mikasa' },
    { name: 'Vot Cau Long', description: 'Vot cau long Yonex, Lining, Victor' },
    { name: 'Do Boi', description: 'Quan ao boi, kinh boi, mu boi' },
    { name: 'Yoga va Fitness', description: 'Tham yoga, day keo, bong tap' },
    { name: 'Dung Cu Tennis', description: 'Vot tennis, bong tennis, phu kien' },
    { name: 'Giay Sneaker', description: 'Giay sneaker thoi trang di hang ngay' },
    { name: 'Ao Khoac The Thao', description: 'Ao khoac gio, ao khoac chong nuoc' },
    { name: 'Tat The Thao', description: 'Tat the thao chong tran, chong mui' },
    { name: 'Kinh Mat The Thao', description: 'Kinh mat chong nang cho chay bo, dap xe' },
    { name: 'Dong Ho The Thao', description: 'Dong ho thong minh, theo doi suc khoe' },
    { name: 'Binh Nuoc The Thao', description: 'Binh nuoc, binh lac protein shaker' },
    { name: 'Bang Bao Ve', description: 'Bang bao ve dau goi, co tay, co chan' },
    { name: 'Dung Cu Bong Ban', description: 'Vot bong ban, bong ban, luoi ban' },
    { name: 'Do Dap Xe', description: 'Gang tay, mu bao hiem, ao dap xe' },
    { name: 'Bo Mon Leo Nui', description: 'Giay leo nui, gay leo nui, balo leo nui' },
    { name: 'Thuc Pham Bo Sung', description: 'Whey protein, BCAA, Pre-workout' },
  ];

  const categories = [];
  for (const c of categoryData) {
    categories.push(await prisma.category.create({ data: c }));
  }
  console.log(`✅ Categories: ${categories.length}`);

  // ═══════════════════════════════════════
  // PRODUCTS: 25 bản ghi (dữ liệu thực tế)
  // ═══════════════════════════════════════
  const brands = ['Nike', 'Adidas', 'Puma', 'New Balance', 'Asics', 'Under Armour', 'Yonex', 'Converse', 'Vans', 'Reebok'];
  const productData = [
    { sku: 'NK-AF1-WHT', name: 'Nike Air Force 1 07', price: 2650000, salePrice: 2450000, desc: 'Giay bong ro duong pho huyen thoai, full trang kinh dien', brand: 'Nike', stock: 45, catIdx: 14 },
    { sku: 'AD-UB22-BLK', name: 'Adidas Ultraboost 22', price: 4500000, salePrice: 3800000, desc: 'Cong nghe de Boost sieu em ai, hoan tra nang luong toi da', brand: 'Adidas', stock: 30, catIdx: 0 },
    { sku: 'PM-RSX-WHT', name: 'Puma RS-X Reinvention', price: 2800000, salePrice: null, desc: 'Phong cach Chunky ham ho, de cao hack dang chuan street style', brand: 'Puma', stock: 60, catIdx: 14 },
    { sku: 'NK-AJ1-RED', name: 'Nike Air Jordan 1 Retro High', price: 5500000, salePrice: 5200000, desc: 'Doi giay mo uoc cua moi Sneakerhead, phoi mau do den huyen thoai', brand: 'Nike', stock: 12, catIdx: 2 },
    { sku: 'NB-550-GRY', name: 'New Balance 550', price: 3200000, salePrice: 2900000, desc: 'Su tro lai cua trao luu retro thap nien 90', brand: 'New Balance', stock: 40, catIdx: 14 },
    { sku: 'VN-OLD-BLK', name: 'Vans Old Skool Black White', price: 1800000, salePrice: 1550000, desc: 'Giay truot van kinh dien, soc jazz trang noi bat', brand: 'Vans', stock: 100, catIdx: 14 },
    { sku: 'CV-1970-BLK', name: 'Converse Chuck Taylor 1970s', price: 2000000, salePrice: 1850000, desc: 'Phien ban nang cap cua Classic voi de mau nga vintage', brand: 'Converse', stock: 80, catIdx: 14 },
    { sku: 'AD-STAN-GRN', name: 'Adidas Stan Smith', price: 2400000, salePrice: null, desc: 'Thiet ke toi gian sang trong, logo got mau xanh la dac trung', brand: 'Adidas', stock: 65, catIdx: 14 },
    { sku: 'AS-KAY-BLU', name: 'Asics Gel-Kayano 29', price: 4200000, salePrice: 3950000, desc: 'Bac thay cong nghe dem Gel bao ve got chan tuyet doi', brand: 'Asics', stock: 25, catIdx: 0 },
    { sku: 'NK-PEG-BLK', name: 'Nike Air Zoom Pegasus 40', price: 3500000, salePrice: 3100000, desc: 'Giay chay bo quoc dan, linh hoat, ben bi va thoang khi', brand: 'Nike', stock: 55, catIdx: 0 },
    { sku: 'NK-MRC-ORG', name: 'Nike Mercurial Superfly 9', price: 4800000, salePrice: 4200000, desc: 'Giay da bong dinh cao cho toc do va su linh hoat', brand: 'Nike', stock: 35, catIdx: 1 },
    { sku: 'AD-PRD-BLK', name: 'Adidas Predator Edge 1', price: 5200000, salePrice: null, desc: 'Giay da bong kiem soat bong tuyet voi voi cong nghe Zone Skin', brand: 'Adidas', stock: 20, catIdx: 1 },
    { sku: 'NK-DRI-BLU', name: 'Nike Dri-FIT Academy Ao', price: 850000, salePrice: 720000, desc: 'Ao the thao nam cong nghe Dri-FIT tham hut mo hoi', brand: 'Nike', stock: 150, catIdx: 3 },
    { sku: 'UA-TECH-GRY', name: 'Under Armour Tech 2.0 Tee', price: 950000, salePrice: 780000, desc: 'Ao tap gym nam co gian 4 chieu, sieu nhe, kho nhanh', brand: 'Under Armour', stock: 120, catIdx: 3 },
    { sku: 'NK-PRO-LGN', name: 'Nike Pro Legging Nu', price: 1200000, salePrice: 980000, desc: 'Quan legging nu do co gian cao, om sat co the', brand: 'Nike', stock: 90, catIdx: 6 },
    { sku: 'AD-TRO3-BLK', name: 'Adidas Tiro 23 Quan', price: 1100000, salePrice: null, desc: 'Quan the thao nam 3 soc kinh dien, co tui keo khoa', brand: 'Adidas', stock: 110, catIdx: 5 },
    { sku: 'YN-AX99-RED', name: 'Yonex Astrox 99 Pro', price: 4500000, salePrice: 4100000, desc: 'Vot cau long cao cap cho loi choi tan cong manh me', brand: 'Yonex', stock: 18, catIdx: 10 },
    { sku: 'NK-BLO-ORG', name: 'Nike Flight Bong Da', price: 1500000, salePrice: 1350000, desc: 'Bong da Nike Flight chinh hang, size 5 tieu chuan', brand: 'Nike', stock: 70, catIdx: 9 },
    { sku: 'UA-GYM-BLK', name: 'Under Armour Weightlifting Gloves', price: 650000, salePrice: null, desc: 'Gang tay tap gym chong tran, bao ve long ban tay', brand: 'Under Armour', stock: 200, catIdx: 7 },
    { sku: 'NK-BRS-BLK', name: 'Nike Brasilia Balo', price: 1100000, salePrice: 950000, desc: 'Balo the thao 25L co ngan dung giay rieng', brand: 'Nike', stock: 85, catIdx: 8 },
    { sku: 'AD-SWIM-BLU', name: 'Adidas 3-Stripes Quan Boi', price: 750000, salePrice: 650000, desc: 'Quan boi nam Adidas co gian thoai mai, kho nhanh', brand: 'Adidas', stock: 95, catIdx: 11 },
    { sku: 'NK-YGA-PPL', name: 'Nike Yoga Mat 5mm', price: 890000, salePrice: null, desc: 'Tham yoga Nike 5mm chong tron, chat lieu than thien moi truong', brand: 'Nike', stock: 60, catIdx: 12 },
    { sku: 'RB-NANO-BLK', name: 'Reebok Nano X3', price: 3200000, salePrice: 2800000, desc: 'Giay tap gym CrossFit, de bang, on dinh cao', brand: 'Reebok', stock: 28, catIdx: 12 },
    { sku: 'NK-WNDB-GRN', name: 'Nike Windbreaker Jacket', price: 2200000, salePrice: 1900000, desc: 'Ao khoac gio Nike nhe, chong nuoc, de gap gon', brand: 'Nike', stock: 50, catIdx: 15 },
    { sku: 'AD-BOTT-SLV', name: 'Adidas Steel Water Bottle 750ml', price: 450000, salePrice: null, desc: 'Binh nuoc inox giu nhiet 24h, dung tich 750ml', brand: 'Adidas', stock: 180, catIdx: 19 },
  ];

  const products = [];
  for (let i = 0; i < productData.length; i++) {
    const p = productData[i];
    const sizes = ['S', 'M', 'L', 'XL'];
    const colors = ['Black', 'White', 'Red', 'Blue', 'Grey'];
    products.push(
      await prisma.product.create({
        data: {
          sku: p.sku,
          name: p.name,
          price: p.price,
          salePrice: p.salePrice,
          description: p.desc,
          stock: p.stock,
          imageUrl: `https://picsum.photos/seed/${p.sku.toLowerCase()}/800/800`,
          brand: p.brand,
          status: 'ACTIVE',
          variations: JSON.stringify([
            { size: sizes[i % sizes.length], color: colors[i % colors.length], stock: Math.floor(p.stock / 2) },
            { size: sizes[(i + 1) % sizes.length], color: colors[(i + 2) % colors.length], stock: Math.ceil(p.stock / 2) },
          ]),
          categoryId: categories[p.catIdx].id,
        },
      }),
    );
  }
  console.log(`✅ Products: ${products.length}`);

  // ═══════════════════════════════════════
  // PRODUCT IMAGES: 25 bản ghi (mỗi SP 1 ảnh phụ)
  // ═══════════════════════════════════════
  for (let i = 0; i < 25; i++) {
    await prisma.productImage.create({
      data: {
        productId: products[i].id,
        imageUrl: `https://picsum.photos/seed/img-${productData[i].sku.toLowerCase()}/900/900`,
      },
    });
  }
  console.log('✅ Product images: 25');

  // ═══════════════════════════════════════
  // COUPONS: 25 bản ghi
  // ═══════════════════════════════════════
  const couponCodes = [
    'WELCOME10', 'SPORT20', 'NEWUSER15', 'SUMMER25', 'FLASH30',
    'VIP50', 'MEMBER10', 'BIRTHDAY20', 'HOLIDAY15', 'FREESHIP',
    'DEAL05', 'DEAL08', 'DEAL12', 'DEAL18', 'DEAL22',
    'SPRING10', 'AUTUMN15', 'WINTER20', 'NEWYEAR25', 'XMAS30',
    'GYM10', 'YOGA15', 'RUN20', 'SWIM10', 'BALL15',
  ];

  for (let i = 0; i < 25; i++) {
    await prisma.coupon.create({
      data: {
        code: couponCodes[i],
        discountPercent: 5 + (i % 6) * 5,
        expiryDate: new Date(`2026-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`),
        isActive: i < 22,
        quantity: 50 + i * 10,
      },
    });
  }
  const coupons = await prisma.coupon.findMany({ orderBy: { id: 'asc' }, take: 25 });
  console.log(`✅ Coupons: ${coupons.length}`);

  // ═══════════════════════════════════════
  // ORDERS: 25 bản ghi
  // ═══════════════════════════════════════
  const statuses: OrderStatus[] = [
    OrderStatus.PENDING, OrderStatus.PAID, OrderStatus.CONFIRMED,
    OrderStatus.SHIPPING, OrderStatus.DELIVERED, OrderStatus.CANCELLED,
  ];
  const paymentMethods = ['COD', 'VNPAY'];
  const createdOrders = [];

  for (let i = 0; i < 25; i++) {
    const customer = customerUsers[i % customerUsers.length];
    const product = products[i % products.length];
    const quantity = (i % 4) + 1;
    const unitPrice = product.salePrice ?? product.price;
    const orderTotal = unitPrice * quantity;

    const order = await prisma.order.create({
      data: {
        userId: customer.id,
        total: orderTotal,
        status: statuses[i % statuses.length],
        paymentMethod: paymentMethods[i % paymentMethods.length],
        address: customer.address ?? `${100 + i} Hai Ba Trung, Da Nang`,
        phone: customer.phone ?? `09030${String(i + 1).padStart(5, '0')}`,
        note: i % 3 === 0 ? `Giao gio hanh chinh, don ${i + 1}` : (i % 3 === 1 ? `Goi truoc khi giao, don ${i + 1}` : null),
        couponId: i % 3 === 0 ? coupons[i % coupons.length].id : null,
        shippingFee: i % 4 === 0 ? 0 : 30000,
      },
    });
    createdOrders.push(order);
  }
  console.log(`✅ Orders: ${createdOrders.length}`);

  // ═══════════════════════════════════════
  // ORDER ITEMS: 25 bản ghi
  // ═══════════════════════════════════════
  const colorsOI = ['Black', 'White', 'Red', 'Blue', 'Grey'];
  const sizesOI = ['S', 'M', 'L', 'XL'];

  for (let i = 0; i < 25; i++) {
    const product = products[i % products.length];
    await prisma.orderItem.create({
      data: {
        orderId: createdOrders[i].id,
        productId: product.id,
        quantity: (i % 4) + 1,
        color: colorsOI[i % colorsOI.length],
        size: sizesOI[i % sizesOI.length],
        price: product.salePrice ?? product.price,
      },
    });
  }
  const createdOrderItems = await prisma.orderItem.findMany({ orderBy: { id: 'asc' }, take: 25 });
  console.log('✅ Order items: 25');

  // ═══════════════════════════════════════
  // CART ITEMS: 25 bản ghi
  // ═══════════════════════════════════════
  const colorsCart = ['Black', 'White', 'Blue', 'Red', 'Green'];

  for (let i = 0; i < 25; i++) {
    const customer = customerUsers[i % customerUsers.length];
    const product = products[(i + 3) % products.length];
    await prisma.cartItem.create({
      data: {
        userId: customer.id,
        productId: product.id,
        quantity: (i % 3) + 1,
        color: colorsCart[i % colorsCart.length],
        size: sizesOI[i % sizesOI.length],
        price: product.salePrice ?? product.price,
      },
    });
  }
  console.log('✅ Cart items: 25');

  // ═══════════════════════════════════════
  // REVIEWS: 25 bản ghi
  // ═══════════════════════════════════════
  const reviewComments = [
    'San pham chat luong tot, giao hang nhanh!',
    'Giay dep, vua chan, rat hai long!',
    'Chat vai mem, mac thoai mai khi tap',
    'Giao hang hoi cham nhung san pham ok',
    'Mau sac dep, dung nhu hinh',
    'San pham chinh hang, dong goi can than',
    'Rat dang tien, se mua lai',
    'Size hoi nho, nen chon lon hon 1 size',
    'Chat luong tuyet voi, 10 diem',
    'De giay em, chay rat suong',
    'Ao dep, thoang mat, phu hop tap gym',
    'Vot nhe tay, danh rat thich',
    'Bong boi tot, khong tham nuoc',
    'Tham yoga chong tron hieu qua',
    'Balo rong, co nhieu ngan',
    'Giay chay nhe, phu hop chay duong dai',
    'Ao khoac dep, chong nuoc tot',
    'Binh nuoc giu nhiet lau',
    'Quan legging om sat, co gian tot',
    'Gang tay chong tran hieu qua',
    'San pham tam trung, chat luong chap nhan duoc',
    'Rat hai long voi don hang nay',
    'Giay de mem, di ca ngay khong dau chan',
    'Chat luong tot so voi gia tien',
    'Se gioi thieu cho ban be',
  ];

  for (let i = 0; i < 25; i++) {
    const customer = customerUsers[i % customerUsers.length];
    const product = products[i % products.length];
    await prisma.review.create({
      data: {
        userId: customer.id,
        productId: product.id,
        rating: (i % 5) + 1,
        comment: reviewComments[i],
        images: i % 3 === 0 ? JSON.stringify([`https://picsum.photos/seed/review-${i + 1}/600/600`]) : null,
        variation: `${sizesOI[i % sizesOI.length]}, ${colorsOI[i % colorsOI.length]}`,
        likes: i * 3,
        orderItemId: createdOrderItems[i]?.id ?? null,
      },
    });
  }
  console.log('✅ Reviews: 25');

  // ═══════════════════════════════════════
  // MESSAGES: 25 bản ghi (hội thoại giữa customer <-> admin/staff)
  // ═══════════════════════════════════════
  const msgContents = [
    'Cho toi hoi giay Nike Air Force 1 con size 42 khong?',
    'Da, hien tai shop con hang size 42 ban nhe!',
    'Toi muon doi san pham vi bi loi, phai lam sao?',
    'Ban vui long gui hinh anh san pham loi de shop kiem tra nhe!',
    'Don hang cua toi da gui chua?',
    'Don hang cua ban da duoc chuyen cho don vi van chuyen roi a!',
    'San pham nay co bao hanh khong?',
    'San pham chinh hang duoc bao hanh 1 nam ban nhe!',
    'Toi muon huy don hang duoc khong?',
    'Ban vui long cung cap ma don hang de shop ho tro nhe!',
    'Ma giam gia WELCOME10 con su dung duoc khong?',
    'Ma nay van con hieu luc den het thang 12 ban nhe!',
    'Khi nao shop co hang moi?',
    'Du kien tuan sau shop se cap nhat BST moi, ban theo doi nhe!',
    'Giay nay co chay bo duoc khong?',
    'Day la giay lifestyle ban a, de chay bo ban nen chon dong Pegasus!',
    'Toi muon mua so luong lon, co giam gia khong?',
    'Mua tu 5 san pham tro len duoc giam 10% ban nhe!',
    'Ship ve Ha Noi mat bao lau?',
    'Giao hang ve Ha Noi tu 3-5 ngay lam viec ban nhe!',
    'Ao nay co co gian khong?',
    'Ao co gian 4 chieu ban nhe, rat thoai mai khi tap!',
    'Cam on shop nhieu nhe!',
    'Cam on ban da ung ho shop! Hen gap lai!',
    'Cho toi xin catalog san pham moi nhat',
  ];

  for (let i = 0; i < 25; i++) {
    const customer = customerUsers[i % customerUsers.length];
    const fromCustomer = i % 2 === 0;
    const staffOrAdmin = i % 5 === 0 ? admin : staffUsers[i % staffUsers.length];
    await prisma.message.create({
      data: {
        senderId: fromCustomer ? customer.id : staffOrAdmin.id,
        receiverId: fromCustomer ? staffOrAdmin.id : customer.id,
        content: msgContents[i],
        status: i < 20 ? 'SEEN' : 'SENT',
      },
    });
  }
  console.log('✅ Messages: 25');

  // ═══════════════════════════════════════
  // NOTIFICATIONS: 25 bản ghi
  // ═══════════════════════════════════════
  const notiTemplates = [
    (orderId: number) => `Don hang #${orderId} da duoc xac nhan`,
    (orderId: number) => `Don hang #${orderId} dang duoc giao`,
    (orderId: number) => `Don hang #${orderId} da giao thanh cong`,
    (orderId: number) => `Don hang #${orderId} da bi huy`,
    (_: number) => 'Ban co ma giam gia moi: WELCOME10',
    (_: number) => 'San pham trong gio hang sap het hang!',
    (orderId: number) => `Don hang #${orderId} dang cho thanh toan`,
    (_: number) => 'Chao mung ban den voi S-Mart Sport Shop!',
    (_: number) => 'Flash Sale - Giam gia den 30% hom nay!',
    (_: number) => 'Danh gia cua ban da duoc phe duyet',
  ];

  for (let i = 0; i < 25; i++) {
    const customer = customerUsers[i % customerUsers.length];
    const order = createdOrders[i % createdOrders.length];
    const template = notiTemplates[i % notiTemplates.length];
    await prisma.notification.create({
      data: {
        userId: customer.id,
        content: template(order.id),
        link: i % 3 !== 2 ? `/orders/${order.id}` : null,
        isRead: i < 15,
      },
    });
  }
  console.log('✅ Notifications: 25');

  console.log('\n🎉 Seed completed with valid sample data (~25 records/table).');
  console.log('   Admin:      admin@smart.com / 123456');
  console.log('   Admin 2:    admin2@smart.com / 123456');
  console.log('   Staff:      staff1@smart.com / 123456');
  console.log('   Customer:   customer@gmail.com / 123456');
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
