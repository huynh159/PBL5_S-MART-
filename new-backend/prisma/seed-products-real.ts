import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Bắt đầu tạo 10 dòng dữ liệu thực tế cho bảng Product...');

  // 1. Đảm bảo có ít nhất 1 danh mục để liên kết với sản phẩm
  const category = await prisma.category.upsert({
    where: { name: 'Giày Thể Thao Cao Cấp' },
    update: {},
    create: {
      name: 'Giày Thể Thao Cao Cấp',
      description: 'Chuyên các dòng giày thể thao chính hãng từ Nike, Adidas, Puma...',
    },
  });

  // 2. Mảng 10 sản phẩm với dữ liệu thực tế (không dùng vòng lặp với data giả)
  const productsData = [
    {
      sku: 'NK-AF1-WHT',
      name: 'Giày Thể Thao Nike Air Force 1 \'07',
      price: 2650000,
      salePrice: 2450000,
      description: 'Huyền thoại bóng rổ đường phố, thiết kế full trắng kinh điển dễ phối đồ.',
      stock: 45,
      imageUrl: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80',
      brand: 'Nike',
      status: 'ACTIVE',
      variations: JSON.stringify([{ size: '40', color: 'White', stock: 20 }, { size: '41', color: 'White', stock: 25 }]),
      categoryId: category.id,
    },
    {
      sku: 'AD-UB22-BLK',
      name: 'Giày Chạy Bộ Adidas Ultraboost 22',
      price: 4500000,
      salePrice: 3800000,
      description: 'Công nghệ đế Boost siêu êm ái, hoàn trả năng lượng tối đa cho người chạy.',
      stock: 30,
      imageUrl: 'https://images.unsplash.com/photo-1584735174965-b1c150fc9ab0?auto=format&fit=crop&w=800&q=80',
      brand: 'Adidas',
      status: 'ACTIVE',
      variations: JSON.stringify([{ size: '42', color: 'Core Black', stock: 15 }, { size: '43', color: 'Core Black', stock: 15 }]),
      categoryId: category.id,
    },
    {
      sku: 'PM-RSX-WHT',
      name: 'Giày Thể Thao Puma RS-X',
      price: 2800000,
      salePrice: null, // Không giảm giá
      description: 'Phong cách Chunky hầm hố, đế cao hack dáng chuẩn street style.',
      stock: 60,
      imageUrl: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=80',
      brand: 'Puma',
      status: 'ACTIVE',
      variations: JSON.stringify([{ size: '39', color: 'White/Red', stock: 30 }, { size: '40', color: 'White/Red', stock: 30 }]),
      categoryId: category.id,
    },
    {
      sku: 'NK-AJ1-RED',
      name: 'Giày Nike Air Jordan 1 Retro High',
      price: 5500000,
      salePrice: 5200000,
      description: 'Đôi giày mơ ước của mọi Sneakerhead, phối màu đỏ đen huyền thoại.',
      stock: 12,
      imageUrl: 'https://images.unsplash.com/photo-1574561168974-912c9b60ab03?auto=format&fit=crop&w=800&q=80',
      brand: 'Nike',
      status: 'ACTIVE',
      variations: JSON.stringify([{ size: '42', color: 'Chicago', stock: 5 }, { size: '42.5', color: 'Chicago', stock: 7 }]),
      categoryId: category.id,
    },
    {
      sku: 'NB-550-GRY',
      name: 'Giày Thể Thao New Balance 550',
      price: 3200000,
      salePrice: 2900000,
      description: 'Sự trở lại của trào lưu retro thập niên 90, êm ái và cực kỳ thời trang.',
      stock: 40,
      imageUrl: 'https://images.unsplash.com/photo-1620606709405-1811e5f80b19?auto=format&fit=crop&w=800&q=80',
      brand: 'New Balance',
      status: 'ACTIVE',
      variations: JSON.stringify([{ size: '41', color: 'Grey/White', stock: 20 }, { size: '42', color: 'Grey/White', stock: 20 }]),
      categoryId: category.id,
    },
    {
      sku: 'VN-OLD-BLK',
      name: 'Giày Vans Old Skool Black/White',
      price: 1800000,
      salePrice: 1550000,
      description: 'Giày trượt ván kinh điển, sọc jazz trắng nổi bật trên nền da lộn đen.',
      stock: 100,
      imageUrl: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&q=80',
      brand: 'Vans',
      status: 'ACTIVE',
      variations: JSON.stringify([{ size: '38', color: 'Black', stock: 50 }, { size: '39', color: 'Black', stock: 50 }]),
      categoryId: category.id,
    },
    {
      sku: 'CV-1970-BLK',
      name: 'Giày Converse Chuck Taylor 1970s',
      price: 2000000,
      salePrice: 1850000,
      description: 'Phiên bản nâng cấp của Classic với đế màu ngà vintage và đệm êm hơn.',
      stock: 80,
      imageUrl: 'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?auto=format&fit=crop&w=800&q=80',
      brand: 'Converse',
      status: 'ACTIVE',
      variations: JSON.stringify([{ size: '40', color: 'Black', stock: 40 }, { size: '41', color: 'Black', stock: 40 }]),
      categoryId: category.id,
    },
    {
      sku: 'AD-STAN-GRN',
      name: 'Giày Thể Thao Adidas Stan Smith',
      price: 2400000,
      salePrice: null, // Không giảm giá
      description: 'Thiết kế tối giản sang trọng, logo gót màu xanh lá đặc trưng.',
      stock: 65,
      imageUrl: 'https://images.unsplash.com/photo-1617325247661-67500508e45b?auto=format&fit=crop&w=800&q=80',
      brand: 'Adidas',
      status: 'ACTIVE',
      variations: JSON.stringify([{ size: '42', color: 'White/Green', stock: 35 }, { size: '43', color: 'White/Green', stock: 30 }]),
      categoryId: category.id,
    },
    {
      sku: 'AS-KAY-BLU',
      name: 'Giày Chạy Bộ Asics Gel-Kayano 29',
      price: 4200000,
      salePrice: 3950000,
      description: 'Bậc thầy công nghệ đệm Gel bảo vệ gót chân tuyệt đối cho cự ly dài.',
      stock: 25,
      imageUrl: 'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=800&q=80',
      brand: 'Asics',
      status: 'ACTIVE',
      variations: JSON.stringify([{ size: '41', color: 'Blue/Orange', stock: 10 }, { size: '42', color: 'Blue/Orange', stock: 15 }]),
      categoryId: category.id,
    },
    {
      sku: 'NK-PEG-BLK',
      name: 'Giày Chạy Bộ Nike Air Zoom Pegasus 40',
      price: 3500000,
      salePrice: 3100000,
      description: 'Đôi giày chạy bộ quốc dân, linh hoạt, bền bỉ và cực kỳ thoáng khí.',
      stock: 55,
      imageUrl: 'https://images.unsplash.com/photo-1605348532760-6753d2c43329?auto=format&fit=crop&w=800&q=80',
      brand: 'Nike',
      status: 'ACTIVE',
      variations: JSON.stringify([{ size: '42', color: 'Black/White', stock: 25 }, { size: '43', color: 'Black/White', stock: 30 }]),
      categoryId: category.id,
    }
  ];

  // 3. Xoá dữ liệu cũ của bảng Product (tuỳ chọn, nếu bạn muốn sạch dữ liệu)
  // Lưu ý: Việc xoá Product có thể ảnh hưởng đến bảng OrderItem, CartItem... nếu đã có khoá ngoại
  // Ở đây tôi dùng upsert qua sku để nếu có rồi thì update, chưa có thì tạo mới.
  
  let count = 0;
  for (const p of productsData) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: p, // Nếu trùng SKU thì cập nhật lại thông tin
      create: p, // Nếu chưa có thì tạo mới
    });
    count++;
  }

  console.log(`✅ Đã thêm/cập nhật thành công ${count} sản phẩm thực tế!`);
}

main()
  .catch((e) => {
    console.error('Lỗi khi chạy seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
