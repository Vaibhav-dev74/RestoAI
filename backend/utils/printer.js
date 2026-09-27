// This is a mock for ESC/POS logic. Replace with actual thermal printing logic.

const printOrder = async (order) => {
    console.log(`🖨️ Printing order for table ${order.table}`);
    order.items.forEach(item => {
      console.log(` - ${item.name} x ${item.qty || 1} (${item.price || 0})`);
    });
    console.log(`Total: ₹${order.total}`);
  };
  
  export default { printOrder };
  