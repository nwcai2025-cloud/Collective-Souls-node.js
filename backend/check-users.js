const { User } = require('./models');

async function checkUsers() {
  try {
    console.log('🔍 Checking users in database...');
    const users = await User.findAll();
    console.log('Users in database:');
    users.forEach(user => {
      console.log(`ID: ${user.id}, Username: ${user.username}, Email: ${user.email}, IsStaff: ${user.is_staff}, IsSuperuser: ${user.is_superuser}`);
    });
    
    // Check for bob@network-connected.com specifically
    const bobUser = await User.findOne({
      where: { email: 'bob@network-connected.com' }
    });
    
    if (bobUser) {
      console.log('\n✅ Found bob@network-connected.com:');
      console.log(`ID: ${bobUser.id}, Username: ${bobUser.username}, IsStaff: ${bobUser.is_staff}, IsSuperuser: ${bobUser.is_superuser}`);
    } else {
      console.log('\n❌ bob@network-connected.com not found');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkUsers();