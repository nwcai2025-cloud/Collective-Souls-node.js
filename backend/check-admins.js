const { User } = require('./models');

async function checkAdmins() {
  try {
    const admins = await User.findAll({ 
      where: { is_staff: true, is_active: true },
      attributes: ['id', 'username', 'email', 'first_name', 'last_name']
    });
    
    console.log('Admin users found:');
    admins.forEach(admin => {
      console.log(`- ID: ${admin.id}, Username: ${admin.username}, Email: ${admin.email}`);
    });
    
    if (admins.length === 0) {
      console.log('No admin users found. Creating test admin...');
      const testAdmin = await User.create({
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123',
        first_name: 'Admin',
        last_name: 'User',
        is_staff: true,
        is_superuser: true,
        is_active: true
      });
      console.log(`Created admin user: ${testAdmin.username}`);
    }
  } catch (error) {
    console.error('Error checking admins:', error);
  }
}

checkAdmins();