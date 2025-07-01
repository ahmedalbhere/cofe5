// التحقق من تسجيل الدخول
if (!localStorage.getItem('adminLoggedIn') && !window.location.pathname.includes('index.html')) {
    window.location.href = 'index.html';
}

new Vue({
    el: '#app',
    data: {
        activeTab: 'orders',
        orders: [],
        products: [],
        loading: true,
        orderFilter: 'active',
        newProduct: {
            emoji: '',
            name: '',
            price: 0,
            category: 'مشروبات ساخنة'
        },
        editingProduct: null
    },
    created() {
        this.fetchOrders();
        this.fetchProducts();
    },
    computed: {
        filteredOrders() {
            if (this.orderFilter === 'all') {
                return this.orders;
            } else if (this.orderFilter === 'active') {
                return this.orders.filter(order => !order.completed);
            } else {
                return this.orders.filter(order => order.completed);
            }
        }
    },
    methods: {
        fetchOrders() {
            this.loading = true;
            database.ref('orders').on('value', (snapshot) => {
                const ordersData = snapshot.val();
                this.orders = [];
                
                if (ordersData) {
                    for (const id in ordersData) {
                        this.orders.push({
                            id,
                            ...ordersData[id]
                        });
                    }
                    
                    // ترتيب الطلبات حسب الأحدث
                    this.orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                }
                
                this.loading = false;
            });
        },
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
                }
            });
        },
        formatTime(timestamp) {
            const date = new Date(timestamp);
            return date.toLocaleString('ar-EG');
        },
        calculateOrderTotal(order) {
            return order.items.reduce((total, item) => total + (item.price * item.quantity), 0);
        },
        completeOrder(orderId) {
            database.ref('orders/' + orderId).update({
                completed: true,
                completedAt: new Date().toISOString()
            });
        },
        addProduct() {
            if (!this.newProduct.emoji || !this.newProduct.name || !this.newProduct.price) {
                alert('الرجاء إدخال جميع البيانات المطلوبة');
                return;
            }

            if (this.editingProduct) {
                // تعديل المنتج الحالي
                database.ref('products/' + this.editingProduct.id).update(this.newProduct)
                    .then(() => {
                        alert('تم تعديل المنتج بنجاح');
                        this.editingProduct = null;
                        this.resetProductForm();
                    });
            } else {
                // إضافة منتج جديد
                database.ref('products').push(this.newProduct)
                    .then(() => {
                        alert('تم إضافة المنتج بنجاح');
                        this.resetProductForm();
                    });
            }
        },
        editProduct(product) {
            this.editingProduct = product;
            this.newProduct = {
                emoji: product.emoji,
                name: product.name,
                price: product.price,
                category: product.category
            };
            window.scrollTo(0, 0);
        },
        deleteProduct(productId) {
            if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
                database.ref('products/' + productId).remove()
                    .then(() => {
                        alert('تم حذف المنتج بنجاح');
                    });
            }
        },
        resetProductForm() {
            this.newProduct = {
                emoji: '',
                name: '',
                price: 0,
                category: 'مشروبات ساخنة'
            };
        },
        logout() {
            localStorage.removeItem('adminLoggedIn');
            window.location.href = 'index.html';
        }
    }
});
