import { useState } from 'react'

function App() {

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function loginUser(event){
    event.preventDefault()
    const response = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        password: password
      }),
    })

    const data = await response.json()

    if(data.user){
      localStorage.setItem('token', data.user)
      window.location.href = '/dashboard'
    }else{
      alert('Please check your email and password')
    }
  }

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={loginUser}>
        <input type="email" id="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" id="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <input type="submit" value="Login" />
      </form>
    </div>
  )
}

export default App