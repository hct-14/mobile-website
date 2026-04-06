import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(config);
// Try with the provided database ID first, if it fails, we might need to use default
const db = getFirestore(app, config.firestoreDatabaseId);

const sampleProducts = [
  {
    name: "Bánh Sinh Nhật Dâu Tây Khổng Lồ",
    price: 450000,
    originalPrice: 550000,
    description: "Bánh kem tươi với lớp dâu tây tươi mọng nước, cốt bánh mềm mịn, ngọt thanh không gắt.",
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80",
    category: "Bánh Sinh Nhật",
    isPopular: true,
    createdAt: new Date().toISOString()
  },
  {
    name: "Bánh Chocolate Hạnh Nhân",
    price: 380000,
    originalPrice: 420000,
    description: "Bánh kem chocolate đậm vị, phủ hạt hạnh nhân rang thơm lừng, phù hợp cho người thích vị đắng nhẹ.",
    image: "https://images.unsplash.com/photo-1557925923-33b251d59000?auto=format&fit=crop&w=800&q=80",
    category: "Bánh Sinh Nhật",
    isPopular: true,
    createdAt: new Date().toISOString()
  },
  {
    name: "Bánh Tiramisu Ý",
    price: 320000,
    originalPrice: 350000,
    description: "Hương vị cà phê Espresso kết hợp cùng phô mai Mascarpone béo ngậy, chuẩn vị Ý.",
    image: "https://images.unsplash.com/photo-1571115177098-24ec42ed204d?auto=format&fit=crop&w=800&q=80",
    category: "Bánh Sinh Nhật",
    isPopular: false,
    createdAt: new Date().toISOString()
  },
  {
    name: "Bánh Kem Trái Cây Nhiệt Đới",
    price: 400000,
    originalPrice: 450000,
    description: "Cốt bánh vani kết hợp cùng các loại trái cây tươi mát: xoài, dâu, kiwi, đào.",
    image: "https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&w=800&q=80",
    category: "Bánh Sinh Nhật",
    isPopular: true,
    createdAt: new Date().toISOString()
  },
  {
    name: "Bánh Red Velvet",
    price: 350000,
    originalPrice: 400000,
    description: "Bánh nhung đỏ lãng mạn với lớp kem phô mai chua ngọt hài hòa.",
    image: "https://images.unsplash.com/photo-1616541823729-00fe0aacd32c?auto=format&fit=crop&w=800&q=80",
    category: "Bánh Sinh Nhật",
    isPopular: false,
    createdAt: new Date().toISOString()
  },
  {
    name: "Bánh Matcha Trà Xanh Nhật Bản",
    price: 360000,
    originalPrice: 390000,
    description: "Sử dụng bột matcha Uji cao cấp, vị chát nhẹ, thơm lừng, không quá ngọt.",
    image: "https://images.unsplash.com/photo-1515037893149-de7f840978e2?auto=format&fit=crop&w=800&q=80",
    category: "Bánh Sinh Nhật",
    isPopular: true,
    createdAt: new Date().toISOString()
  }
];

async function seed() {
  try {
    console.log("Seeding database...");
    for (const product of sampleProducts) {
      await addDoc(collection(db, "products"), product);
      console.log(`Added: ${product.name}`);
    }
    console.log("Seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding:", err);
    process.exit(1);
  }
}

seed();
