/**
 * RuviaOS - Shared Data Store
 * ============================================================
 * All pages read/write through this store using localStorage.
 * Changes in one page are instantly visible in others.
 *
 * Usage:
 *   RuviaStore.getRooms()              → array of rooms
 *   RuviaStore.saveRooms(rooms)        → persist rooms
 *   RuviaStore.updateRoomStatus(id, status) → update one room
 *   ... (see API below)
 */

(function () {
    // ── Keys ──────────────────────────────────────────────────
    const KEYS = {
        rooms:        'ruvia_rooms',
        guests:       'ruvia_guests',
        reservations: 'ruvia_reservations',
        products:     'ruvia_products',
        orders:       'ruvia_orders',
        housekeeping: 'ruvia_housekeeping_log',
        nextIds:      'ruvia_next_ids',
    };

    // ── Default / seed data ───────────────────────────────────
    const DEFAULTS = {
        rooms: [
            { id:1,  room_number:'101', room_type:'Standard', floor:1, beds:1, max_occupancy:2, base_price:80000,  status:'occupied', assigned_housekeeper:null, notes:'' },
            { id:2,  room_number:'102', room_type:'Standard', floor:1, beds:1, max_occupancy:2, base_price:80000,  status:'occupied', assigned_housekeeper:null, notes:'' },
            { id:3,  room_number:'103', room_type:'Standard', floor:1, beds:2, max_occupancy:3, base_price:90000,  status:'ready',    assigned_housekeeper:null, notes:'' },
            { id:4,  room_number:'104', room_type:'Standard', floor:1, beds:1, max_occupancy:2, base_price:80000,  status:'dirty',    assigned_housekeeper:'Sarah', notes:'' },
            { id:5,  room_number:'105', room_type:'Standard', floor:1, beds:2, max_occupancy:3, base_price:90000,  status:'ready',    assigned_housekeeper:null, notes:'' },
            { id:6,  room_number:'201', room_type:'Deluxe',   floor:2, beds:1, max_occupancy:2, base_price:120000, status:'occupied', assigned_housekeeper:null, notes:'' },
            { id:7,  room_number:'202', room_type:'Deluxe',   floor:2, beds:1, max_occupancy:2, base_price:120000, status:'ready',    assigned_housekeeper:null, notes:'' },
            { id:8,  room_number:'203', room_type:'Deluxe',   floor:2, beds:2, max_occupancy:4, base_price:140000, status:'ready',    assigned_housekeeper:null, notes:'' },
            { id:9,  room_number:'204', room_type:'Deluxe',   floor:2, beds:2, max_occupancy:4, base_price:140000, status:'dirty',    assigned_housekeeper:'John', notes:'' },
            { id:10, room_number:'301', room_type:'Suite',    floor:3, beds:1, max_occupancy:2, base_price:200000, status:'occupied', assigned_housekeeper:null, notes:'' },
            { id:11, room_number:'302', room_type:'Suite',    floor:3, beds:1, max_occupancy:2, base_price:200000, status:'ready',    assigned_housekeeper:null, notes:'' },
            { id:12, room_number:'303', room_type:'Suite',    floor:3, beds:2, max_occupancy:4, base_price:250000, status:'dirty',    assigned_housekeeper:'Mary', notes:'' },
        ],
        guests: [
            { id:1, full_name:'John Smith',    email:'john@email.com',    phone:'0700111111', address:'123 Main St',       id_number:'ID123456', nationality:'American',  total_stays:3, total_spent:720000,  last_stay:'2026-04-10' },
            { id:2, full_name:'Sarah Johnson', email:'sarah@email.com',   phone:'0700222222', address:'456 Park Ave',      id_number:'ID789012', nationality:'British',   total_stays:2, total_spent:480000,  last_stay:'2026-04-05' },
            { id:3, full_name:'Michael Brown', email:'michael@email.com', phone:'0700333333', address:'789 Lake Road',     id_number:'ID345678', nationality:'Canadian',  total_stays:1, total_spent:360000,  last_stay:'2026-04-12' },
            { id:4, full_name:'Emma Wilson',   email:'emma@email.com',    phone:'0700444444', address:'321 Hill Street',   id_number:'ID901234', nationality:'Australian',total_stays:1, total_spent:240000,  last_stay:'2026-04-14' },
            { id:5, full_name:'James Otundo',  email:'james@email.com',   phone:'0712345678', address:'15 Acacia Avenue',  id_number:'ID567890', nationality:'Ugandan',   total_stays:2, total_spent:360000,  last_stay:'2026-04-08' },
        ],
        reservations: [
            { id:1, reservation_number:'RES-001', guest_id:1, room_id:1,  check_in:'2026-04-15', check_out:'2026-04-18', adults:2, children:0, total_amount:240000, paid_amount:120000, balance:120000, status:'checked-in', source:'Booking.com', created_at:'2026-04-10' },
            { id:2, reservation_number:'RES-002', guest_id:2, room_id:2,  check_in:'2026-04-16', check_out:'2026-04-17', adults:1, children:0, total_amount:80000,  paid_amount:80000,  balance:0,      status:'checked-in', source:'Direct',      created_at:'2026-04-12' },
            { id:3, reservation_number:'RES-003', guest_id:3, room_id:6,  check_in:'2026-04-17', check_out:'2026-04-20', adults:2, children:1, total_amount:360000, paid_amount:180000, balance:180000, status:'checked-in', source:'Expedia',      created_at:'2026-04-14' },
            { id:4, reservation_number:'RES-004', guest_id:4, room_id:3,  check_in:'2026-04-17', check_out:'2026-04-19', adults:2, children:0, total_amount:180000, paid_amount:0,      balance:180000, status:'confirmed',  source:'Phone',        created_at:'2026-04-15' },
            { id:5, reservation_number:'RES-005', guest_id:5, room_id:7,  check_in:'2026-04-18', check_out:'2026-04-22', adults:2, children:0, total_amount:480000, paid_amount:0,      balance:480000, status:'confirmed',  source:'Booking.com',  created_at:'2026-04-16' },
        ],
        products: [
            { id:1,  sku:'BEER-001',      name:'Local Beer',            category:'beverage', unit_price:5000,  current_stock:45, reorder_level:30, location:'Bar Cooler',      unit_cost:3500,  emoji:'🍺' },
            { id:2,  sku:'WINE-001',      name:'House Wine',            category:'beverage', unit_price:8000,  current_stock:12, reorder_level:15, location:'Bar Cooler',      unit_cost:5500,  emoji:'🍷' },
            { id:3,  sku:'COFFEE-001',    name:'Fresh Coffee',          category:'beverage', unit_price:3000,  current_stock:50, reorder_level:20, location:'Kitchen',         unit_cost:1500,  emoji:'☕' },
            { id:4,  sku:'STEAK-001',     name:'Grilled Steak',         category:'food',     unit_price:25000, current_stock:8,  reorder_level:10, location:'Kitchen Freezer', unit_cost:15000, emoji:'🥩' },
            { id:5,  sku:'BURGER-001',    name:'Beef Burger',           category:'food',     unit_price:12000, current_stock:5,  reorder_level:8,  location:'Kitchen Freezer', unit_cost:7000,  emoji:'🍔' },
            { id:6,  sku:'SODA-001',      name:'Soft Drink',            category:'beverage', unit_price:2500,  current_stock:60, reorder_level:25, location:'Bar Cooler',      unit_cost:1500,  emoji:'🥤' },
            { id:7,  sku:'PIZZA-001',     name:'Margherita Pizza',      category:'food',     unit_price:18000, current_stock:3,  reorder_level:5,  location:'Kitchen Freezer', unit_cost:10000, emoji:'🍕' },
            { id:8,  sku:'SALAD-001',     name:'Garden Salad',          category:'food',     unit_price:8000,  current_stock:10, reorder_level:8,  location:'Kitchen',         unit_cost:4000,  emoji:'🥗' },
            { id:9,  sku:'BFAST-001',     name:'Continental Breakfast', category:'food',     unit_price:15000, current_stock:20, reorder_level:10, location:'Kitchen',         unit_cost:8000,  emoji:'🍳' },
            { id:10, sku:'WINGS-001',     name:'Chicken Wings',         category:'food',     unit_price:10000, current_stock:15, reorder_level:10, location:'Kitchen Freezer', unit_cost:6000,  emoji:'🍗' },
            { id:11, sku:'FRIES-001',     name:'French Fries',          category:'food',     unit_price:5000,  current_stock:25, reorder_level:15, location:'Kitchen Freezer', unit_cost:2500,  emoji:'🍟' },
            { id:12, sku:'CHICKEN-001',   name:'Grilled Chicken',       category:'food',     unit_price:22000, current_stock:7,  reorder_level:8,  location:'Kitchen Freezer', unit_cost:12000, emoji:'🍗' },
            { id:13, sku:'SPA-001',       name:'Massage Session',       category:'spa',      unit_price:50000, current_stock:8,  reorder_level:5,  location:'Spa Stock',       unit_cost:20000, emoji:'💆' },
        ],
        orders: [],
        housekeeping_log: [
            { room:'101', action:'Status Change',     old_status:'occupied', new_status:'dirty',    assigned_to:'Mary',  time:'2026-04-17 10:30' },
            { room:'102', action:'Cleaning Completed',old_status:'dirty',    new_status:'ready',    assigned_to:'John',  time:'2026-04-17 09:15' },
            { room:'201', action:'Status Change',     old_status:'ready',    new_status:'occupied', assigned_to:'-',     time:'2026-04-16 15:00' },
            { room:'104', action:'Assigned',          old_status:'dirty',    new_status:'cleaning', assigned_to:'Sarah', time:'2026-04-16 11:00' },
            { room:'303', action:'Status Change',     old_status:'ready',    new_status:'dirty',    assigned_to:'Mary',  time:'2026-04-16 09:30' },
        ],
        nextIds: { room:13, guest:6, reservation:6, product:14, order:1 },
    };

    // ── Internal helpers ──────────────────────────────────────
    function load(key, defaultVal) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : defaultVal;
        } catch(e) { return defaultVal; }
    }
    function save(key, data) {
        try { localStorage.setItem(key, JSON.stringify(data)); return true; }
        catch(e) { console.error('RuviaStore save error', key, e); return false; }
    }
    function nextId(entity) {
        const ids = load(KEYS.nextIds, DEFAULTS.nextIds);
        const id = ids[entity] || 1;
        ids[entity] = id + 1;
        save(KEYS.nextIds, ids);
        return id;
    }
    function nowISO() {
        return new Date().toISOString().slice(0,16).replace('T',' ');
    }
    // Broadcast a storage event to other tabs/pages
    function broadcast(event, payload) {
        try {
            const msg = JSON.stringify({ event, payload, ts: Date.now() });
            localStorage.setItem('ruvia_event', msg);
            // Immediately remove so repeated events fire
            localStorage.removeItem('ruvia_event');
        } catch(e) {}
    }

    // ── Public API ────────────────────────────────────────────
    const RuviaStore = {

        // ---- ROOMS ----
        getRooms() { return load(KEYS.rooms, DEFAULTS.rooms); },
        saveRooms(rooms) { save(KEYS.rooms, rooms); broadcast('rooms_changed', {}); },
        updateRoomStatus(roomId, newStatus, housekeeper = null) {
            const rooms = this.getRooms();
            const r = rooms.find(r => r.id === roomId);
            if (!r) return false;
            const oldStatus = r.status;
            r.status = newStatus;
            if (housekeeper !== null) r.assigned_housekeeper = housekeeper;
            this.saveRooms(rooms);
            // Log to housekeeping
            this.addHousekeepingLog({ room: r.room_number, action:'Status Change', old_status: oldStatus, new_status: newStatus, assigned_to: housekeeper || '-', time: nowISO() });
            broadcast('room_status_changed', { roomId, newStatus });
            return true;
        },
        addRoom(roomData) {
            const rooms = this.getRooms();
            const id = nextId('room');
            rooms.push({ ...roomData, id });
            this.saveRooms(rooms);
            return id;
        },

        // ---- GUESTS ----
        getGuests() { return load(KEYS.guests, DEFAULTS.guests); },
        saveGuests(guests) { save(KEYS.guests, guests); broadcast('guests_changed', {}); },
        addGuest(guestData) {
            const guests = this.getGuests();
            const id = nextId('guest');
            guests.push({ ...guestData, id, total_stays: 0, total_spent: 0, last_stay: null });
            this.saveGuests(guests);
            return id;
        },
        getGuestById(id) { return this.getGuests().find(g => g.id === id) || null; },

        // ---- RESERVATIONS ----
        getReservations() { return load(KEYS.reservations, DEFAULTS.reservations); },
        saveReservations(res) { save(KEYS.reservations, res); broadcast('reservations_changed', {}); },
        addReservation(resData) {
            const reservations = this.getReservations();
            const id = nextId('reservation');
            const resNum = 'RES-' + String(id).padStart(3,'0');
            const newRes = { ...resData, id, reservation_number: resNum, created_at: nowISO(), balance: (resData.total_amount || 0) - (resData.paid_amount || 0) };
            reservations.push(newRes);
            this.saveReservations(reservations);
            return id;
        },
        checkIn(reservationId) {
            const reservations = this.getReservations();
            const res = reservations.find(r => r.id === reservationId);
            if (!res) return false;
            res.status = 'checked-in';
            res.actual_checkin = nowISO();
            this.saveReservations(reservations);
            // Mark room occupied
            this.updateRoomStatus(res.room_id, 'occupied');
            broadcast('checkin', { reservationId, roomId: res.room_id });
            return true;
        },
        checkOut(reservationId) {
            const reservations = this.getReservations();
            const res = reservations.find(r => r.id === reservationId);
            if (!res) return false;
            res.status = 'checked-out';
            res.actual_checkout = nowISO();
            // Update guest stats
            const guests = this.getGuests();
            const guest = guests.find(g => g.id === res.guest_id);
            if (guest) {
                guest.total_stays = (guest.total_stays || 0) + 1;
                guest.total_spent = (guest.total_spent || 0) + (res.paid_amount || 0);
                guest.last_stay = nowISO().slice(0,10);
                this.saveGuests(guests);
            }
            this.saveReservations(reservations);
            // Mark room dirty (needs cleaning after checkout)
            this.updateRoomStatus(res.room_id, 'dirty');
            broadcast('checkout', { reservationId, roomId: res.room_id });
            return true;
        },
        recordPayment(reservationId, amount) {
            const reservations = this.getReservations();
            const res = reservations.find(r => r.id === reservationId);
            if (!res) return false;
            res.paid_amount = (res.paid_amount || 0) + amount;
            res.balance = Math.max(0, (res.total_amount || 0) - res.paid_amount);
            this.saveReservations(reservations);
            broadcast('payment', { reservationId, amount });
            return true;
        },

        // ---- PRODUCTS / STOCK ----
        getProducts() { return load(KEYS.products, DEFAULTS.products); },
        saveProducts(products) { save(KEYS.products, products); broadcast('products_changed', {}); },
        addProduct(productData) {
            const products = this.getProducts();
            const id = nextId('product');
            products.push({ ...productData, id });
            this.saveProducts(products);
            return id;
        },
        updateStock(productId, delta, reason = '') {
            const products = this.getProducts();
            const p = products.find(p => p.id === productId);
            if (!p) return false;
            p.current_stock = Math.max(0, (p.current_stock || 0) + delta);
            this.saveProducts(products);
            broadcast('stock_changed', { productId, delta, reason });
            return true;
        },

        // ---- ORDERS (POS) ----
        getOrders() { return load(KEYS.orders, DEFAULTS.orders); },
        saveOrders(orders) { save(KEYS.orders, orders); },
        addOrder(orderData) {
            const orders = this.getOrders();
            const id = nextId('order');
            const order = { ...orderData, id, order_number: 'ORD-' + String(id).padStart(4,'0'), created_at: nowISO() };
            orders.push(order);
            // Deduct stock for each item
            order.items && order.items.forEach(item => {
                this.updateStock(item.product_id, -item.quantity, `POS Order ${order.order_number}`);
            });
            this.saveOrders(orders);
            broadcast('new_order', { orderId: id });
            return id;
        },

        // ---- HOUSEKEEPING LOG ----
        getHousekeepingLog() { return load(KEYS.housekeeping, DEFAULTS.housekeeping_log); },
        addHousekeepingLog(entry) {
            const log = this.getHousekeepingLog();
            log.unshift({ ...entry, time: entry.time || nowISO() });
            save(KEYS.housekeeping, log.slice(0, 200)); // keep last 200 entries
        },

        // ---- DASHBOARD SUMMARY ----
        getSummary() {
            const rooms        = this.getRooms();
            const reservations = this.getReservations();
            const orders       = this.getOrders();
            const products     = this.getProducts();
            const today        = new Date().toISOString().slice(0,10);

            const totalRooms    = rooms.length;
            const occupied      = rooms.filter(r => r.status === 'occupied').length;
            const available     = rooms.filter(r => r.status === 'ready').length;
            const dirty         = rooms.filter(r => r.status === 'dirty').length;
            const cleaning      = rooms.filter(r => r.status === 'cleaning').length;
            const occupancyRate = Math.round((occupied / totalRooms) * 100);

            const todayArrivals   = reservations.filter(r => r.check_in === today && r.status === 'confirmed').length;
            const todayDepartures = reservations.filter(r => r.check_out === today && r.status === 'checked-in').length;
            const pendingBalance  = reservations.reduce((s, r) => s + (r.balance || 0), 0);
            const totalRevenue    = reservations.reduce((s, r) => s + (r.paid_amount || 0), 0);

            const todaySales  = orders.filter(o => o.created_at && o.created_at.startsWith(today)).reduce((s,o) => s + (o.total || 0), 0);
            const lowStock    = products.filter(p => p.current_stock <= p.reorder_level).length;

            return { totalRooms, occupied, available, dirty, cleaning, occupancyRate, todayArrivals, todayDepartures, pendingBalance, totalRevenue, todaySales, lowStock };
        },

        // ---- INIT (seed only if empty) ----
        init() {
            if (!localStorage.getItem(KEYS.rooms))        save(KEYS.rooms, DEFAULTS.rooms);
            if (!localStorage.getItem(KEYS.guests))       save(KEYS.guests, DEFAULTS.guests);
            if (!localStorage.getItem(KEYS.reservations)) save(KEYS.reservations, DEFAULTS.reservations);
            if (!localStorage.getItem(KEYS.products))     save(KEYS.products, DEFAULTS.products);
            if (!localStorage.getItem(KEYS.orders))       save(KEYS.orders, DEFAULTS.orders);
            if (!localStorage.getItem(KEYS.nextIds))      save(KEYS.nextIds, DEFAULTS.nextIds);
            console.log('✅ RuviaStore initialised');
        },

        // ---- RESET (dev / testing) ----
        reset() {
            Object.values(KEYS).forEach(k => localStorage.removeItem(k));
            this.init();
            console.log('🔄 RuviaStore reset to defaults');
        },

        // ── Listen for cross-page changes ────────────────────
        onChange(callback) {
            window.addEventListener('storage', (e) => {
                if (e.key === 'ruvia_event' && e.newValue) {
                    try { callback(JSON.parse(e.newValue)); } catch(err) {}
                }
                // Also re-broadcast for same-tab listeners:
                const dataKeys = Object.values(KEYS);
                if (dataKeys.includes(e.key)) {
                    callback({ event: e.key + '_changed', payload: {} });
                }
            });
        }
    };

    // Auto-init
    RuviaStore.init();

    // Expose globally
    window.RuviaStore = RuviaStore;

})();
