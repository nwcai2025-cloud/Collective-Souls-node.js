import React from 'react'

const AdminTest: React.FC = () => {
  console.log('AdminTest component rendered')
  
  return (
    <div style={{ padding: '20px', backgroundColor: 'red', color: 'white' }}>
      <h1>Admin Test Page</h1>
      <p>This is a test to see if the admin route is working</p>
      <button 
        onClick={() => console.log('Test button clicked')}
        style={{ padding: '10px', backgroundColor: 'blue', color: 'white', border: 'none', cursor: 'pointer' }}
      >
        Test Button
      </button>
    </div>
  )
}

export default AdminTest