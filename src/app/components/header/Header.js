import Image from 'next/image'
import Link from 'next/link'
import { logo, title } from '@/app/constant'

export default function Header() {
  return (
    <header>
      <nav className='flex flex-wrap items-center justify-between px-4 py-4 bg-white border-gray-200 lg:px-6 dark:bg-gray-800 '>
        <Link href='/'>
          <Image src={logo} className='rounded-full' alt='Tweet generator Logo' width={50} height={250} />
        </Link>
        <span className='self-center text-xl font-semibold whitespace-nowrap dark:text-white'>{title}</span>
      </nav>
    </header>
  )
}