// inventory_catalogs_test.js
// Unit test for Aurelius unified inventory catalogs and movement logic.

const assert = require('assert');

console.log('Running inventory catalogs and deferred payments test...');

// 1. Mock DB
const db = {
    plots: [
        { id: 'plot-1', name: 'Talhão Norte', crop_type: 'Soja' }
    ],
    machinery: [
        { id: 'mach-1', name: 'Trator JD 6150J', fuel_level_percent: 50 }
    ],
    seedsGrainsProducts: [
        { id: 'sg-prod-1', name: 'Soja Nidera 5909', category: 'Semente', unit: 'Sacas' },
        { id: 'sg-prod-2', name: 'Milho Dekalb 265', category: 'Semente', unit: 'Sacas' },
        { id: 'sg-prod-3', name: 'Soja Colhida', category: 'Grão', unit: 'Sacas' }
    ],
    seedsGrainsMovements: [],
    fuels: [
        { id: 'fuel-diesel-s10', name: 'Diesel S10', capacity: 5000 }
    ],
    fuelMovements: [],
    transactions: []
};

// 2. Mock functions
function getSeedGrainStock(productId) {
    const entries = db.seedsGrainsMovements.filter(m => m.product_id === productId && m.type === 'entrada');
    const exits = db.seedsGrainsMovements.filter(m => m.product_id === productId && m.type === 'saida');
    const totalIn = entries.reduce((sum, m) => sum + (parseFloat(m.quantity) || 0), 0);
    const totalOut = exits.reduce((sum, m) => sum + (parseFloat(m.quantity) || 0), 0);
    return Math.max(0, totalIn - totalOut);
}

function getFuelStock(fuelId) {
    const entries = db.fuelMovements.filter(m => m.fuel_id === fuelId && m.type === 'entrada');
    const exits = db.fuelMovements.filter(m => m.fuel_id === fuelId && m.type === 'saida');
    const totalIn = entries.reduce((sum, m) => sum + (parseFloat(m.quantity) || 0), 0);
    const totalOut = exits.reduce((sum, m) => sum + (parseFloat(m.quantity) || 0), 0);
    return Math.max(0, totalIn - totalOut);
}

function payPendingTransaction(txId) {
    const tx = db.transactions.find(t => t.id === txId);
    if (tx) {
        tx.payment_status = 'pago';
        if (tx.movement_id) {
            const pm = db.seedsGrainsMovements.find(m => m.id === tx.movement_id);
            if (pm) {
                pm.payment_type = 'À vista';
            }
            const fm = db.fuelMovements.find(m => m.id === tx.movement_id);
            if (fm) {
                fm.payment_type = 'À vista';
            }
        }
    }
}

// 3. Test Cases

// A. Test Seeds & Grains Stock
db.seedsGrainsMovements.push({
    id: 'mov-1',
    product_id: 'sg-prod-1',
    type: 'entrada',
    sub_type: 'compra',
    quantity: 100
});
assert.strictEqual(getSeedGrainStock('sg-prod-1'), 100, 'Initial entry fails');

db.seedsGrainsMovements.push({
    id: 'mov-2',
    product_id: 'sg-prod-1',
    type: 'saida',
    sub_type: 'plantio',
    quantity: 40
});
assert.strictEqual(getSeedGrainStock('sg-prod-1'), 60, 'Planting exit calculation fails');

// B. Test Fuel Movements
db.fuelMovements.push({
    id: 'fmov-1',
    fuel_id: 'fuel-diesel-s10',
    type: 'entrada',
    quantity: 1000
});
assert.strictEqual(getFuelStock('fuel-diesel-s10'), 1000, 'Fuel central charge fails');

db.fuelMovements.push({
    id: 'fmov-2',
    fuel_id: 'fuel-diesel-s10',
    type: 'saida',
    quantity: 200,
    machinery_id: 'mach-1'
});
assert.strictEqual(getFuelStock('fuel-diesel-s10'), 800, 'Fuel consumption calculation fails');

// C. Test Deferred Payment / Settlement
db.transactions.push({
    id: 'tx-defer-1',
    type: 'gasto',
    description: 'Compra de Sementes a Prazo',
    amount: 1500,
    currency: 'BRL',
    movement_id: 'mov-1',
    payment_status: 'pendente'
});

payPendingTransaction('tx-defer-1');
assert.strictEqual(db.transactions[0].payment_status, 'pago', 'Transaction pay status update fails');
assert.strictEqual(db.seedsGrainsMovements[0].payment_type, 'À vista', 'Linked movement update fails');

console.log('✅ Inventory and Deferred Payments unit tests passed successfully!');
process.exit(0);
