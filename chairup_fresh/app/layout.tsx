import './globals.css'
import Nav from '../components/Nav'
export const metadata = {
  title:'ChairUp — Beautiful bookings for any service',
  description:'Book barbers, stylists, trainers, tutors, and more.'
}
export default function RootLayout({children}:{children:React.ReactNode}){
  return (<html lang="en"><body><Nav /><main className="container py-8">{children}</main></body></html>)
}
