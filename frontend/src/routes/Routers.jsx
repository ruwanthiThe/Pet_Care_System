
import Home from '../pages/Home'

import Contact from '../pages/Contact'
import Login from '../pages/Login'
import SignUp from '../pages/SignUp'
import Services from '../pages/Services'
import Doctor from '../pages/Doctor/Doctor'
import DoctorDetails from '../pages/Doctor/DoctorDetails'
import {Routes, Route} from 'react-router-dom' 


const Routers = () => {
  return (
    <Routes>
      <Route path='/' element={<Home />} />
      <Route path='/contact' element={<Contact />} />
      <Route path='/login' element={<Login />} />
      <Route path='/signup' element={<SignUp />} />
      <Route path='/services' element={<Services />} />
      <Route path='/doctor' element={<Doctor />} />
      <Route path='/doctor/:id' element={<DoctorDetails />} />
    </Routes>
  )
}

export default Routers
