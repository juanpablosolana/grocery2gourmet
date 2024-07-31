import Link from 'next/link'
import { title } from '@/app/constant'
export default function Footer() {
return (
<footer className='bg-white md:p-8 lg:p-4 dark:bg-gray-800'>
  <div className='max-w-screen-xl mx-auto text-center'>
      <p className='my-2 text-gray-500 dark:text-gray-400'>{title}</p>
    <span className='text-sm text-gray-500 sm:text-center dark:text-gray-400'>
      Developed by <Link href='https://pablosolana.dev' className='hover:underline'>Pablo Solana</Link>
    </span>
  </div>
  </footer>
)
}