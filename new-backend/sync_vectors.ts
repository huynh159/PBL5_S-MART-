/// <reference lib="dom" />
import * as dotenv from 'dotenv';
dotenv.config();
import { prisma } from './src/infrastructure/persistence/PrismaClient';
import { GeminiVectorService } from './src/infrastructure/external-services/GeminiVectorService';

async function syncAllProductVectors() {
    console.log('🔄 Bắt đầu đồng bộ Vector Embeddings cho toàn bộ sản phẩm...');
    const vectorService = new GeminiVectorService();

    const products = await prisma.product.findMany();
    let successCount = 0;

    for (const product of products) {
        try {
            const category = product.categoryId ? await prisma.category.findUnique({ where: { id: product.categoryId } }) : null;
            const textToEmbed = vectorService.formatProductText(
                product.name,
                product.description,
                product.brand,
                category?.name || null,
                product.variations
            );

function removeVietnameseTones(str: string): string {
    if (!str) return '';
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|MỠ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); // Huyền sắc hỏi ngã nặng 
    str = str.replace(/\u02C6|\u0306|\u031B/g, ""); // Â, Ê, Ă, Ơ, Ư
    return str.toLowerCase().trim();
}

            console.log(`Tiến hành nhúng sản phẩm ID ${product.id}: ${product.name}...`);
            const embedding = await vectorService.generateEmbedding(textToEmbed);
            const vectorStr = JSON.stringify(embedding);
            const searchText = removeVietnameseTones(`${product.name} ${product.description || ''} ${product.brand || ''} ${category?.name || ''} ${product.variations || ''}`);

            await prisma.product.update({
                where: { id: product.id },
                data: { 
                    vectorData: vectorStr,
                    searchText: searchText
                }
            });

            successCount++;
        } catch (error) {
            console.error(`❌ Lỗi nhúng sản phẩm ID ${product.id}:`, error);
        }
    }

    console.log(`✅ Hoàn thành! Đã nhúng thành công ${successCount}/${products.length} sản phẩm.`);
}

syncAllProductVectors()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
