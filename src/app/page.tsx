// Root page — redirect to landing HTML
import { redirect } from 'next/navigation'
export default function Home() {
  redirect('/index.html')
}
