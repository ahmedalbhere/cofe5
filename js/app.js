// الانتقال من صفحة الطاولة إلى القائمة
function startOrder() {
    const tableNumber = document.getElementById('tableNumber').value;
    if (tableNumber && tableNumber > 0) {
        localStorage.setItem('currentTable', tableNumber);
        window.location.href = 'menu.html';
    } else {
        alert('الرجاء إدخال رقم طاولة صحيح');
    }
}

// تهيئة Firebase
const firebaseConfig = {
    apiKey: "AIzaSyYOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT.firebaseio.com",
    projectId: "YOUR_PROJECT",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// تطبيق Vue.js لصفحة القائمة
if (window.location.pathname.endsWith('menu.html')) {
    new Vue({
        el: '#app',
        data: {
            tableNumber: localStorage.getItem('currentTable') || 1,
            products: [],
            currentCategory: 'جميع الفئات',
            cart: [],
            notes: {}
        },
        created() {
            this.fetchProducts();
        },
        computed: {
            categories() {
                const cats = ['جميع الفئات', ...new Set(this.products.map(p => p.category))];
                return cats;
            },
            filteredProducts() {
                if (this.currentCategory === 'جميع الفئات') {
                    return this.products;
                }
                return this.products.filter(p => p.category === this.currentCategory);
            },
            total() {
                return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            }
        },
        methods: {
            fetchProducts() {
                database.ref('products').on('value', (snapshot) => {
                    const productsData = snapshot.val();
                    this.products = [];
                    
                    if (productsData) {
                        for (const id in productsData) {
                            this.products.push({
                                id,
                                ...productsData[id]
                            });
                        }
                    } else {
                        // بيانات افتراضية إذا لم توجد منتجات في Firebase
                        this.products = [
                            {id: '1', emoji: '☕', name: 'إسبريسو', price: 30, category: 'مشروبات ساخنة'},
                            {id: '2', emoji: '☕', name: 'كابتشينو', price: 35, category: 'مشروبات ساخنة'},
                            {id: '3', emoji: '🧊', name: 'آيس كوفي', price: 40, category: 'مشروبات باردة'},
                            {id: '4', emoji: '🍰', name: 'كيك الشوكولاتة', price: 50, category: 'حلويات'}
                        ];
                    }
                });
            },
            setCategory(category) {
                this.currentCategory = category;
            },
            increaseQuantity(product) {
                const existingItem = this.cart.find(item => item.id === product.id);
                if (existingItem) {
                    existingItem.quantity++;
                } else {
                    this.cart.push({
                        id: product.id,
                        emoji: product.emoji,
                        name: product.name,
                        price: product.price,
                        quantity: 1,
                        notes: this.notes[product.id] || ''
                    });
                }
            },
            decreaseQuantity(product) {
                const existingItem = this.cart.find(item => item.id === product.id);
                if (existingItem) {
                    existingItem.quantity--;
                    if (existingItem.quantity <= 0) {
                        this.cart = this.cart.filter(item => item.id !== product.id);
                    }
                }
            },
            getQuantity(productId) {
                const item = this.cart.find(item => item.id === productId);
                return item ? item.quantity : 0;
            },
            submitOrder() {
                const order = {
                    tableNumber: parseInt(this.tableNumber),
                    items: this.cart.map(item => ({
                        productId: item.id,
                        emoji: item.emoji,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        notes: item.notes
                    })),
                    status: 'new',
                    createdAt: new Date().toISOString(),
                    completed: false
                };

                database.ref('orders').push(order)
                    .then(() => {
                        alert('تم إرسال طلبك بنجاح!');
                        this.cart = [];
                        this.notes = {};
                    })
                    .catch(error => {
                        console.error('Error submitting order:', error);
                        alert('حدث خطأ أثناء إرسال الطلب');
                    });
            },
            exitOrder() {
                localStorage.removeItem('currentTable');
                window.location.href = 'index.html';
            }
        }
    });
}
