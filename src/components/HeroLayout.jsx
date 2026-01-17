import React from 'react'
import Heroimg from '../assets/img/noxa-layout.png'
import { FiMail, FiCheckCircle, FiClock, FiTarget } from 'react-icons/fi'

const HeroLayout = () => {
  return (
    <div className='relative flex justify-center items-center h-60 w-full'>
      
      {/* Outer glass layer */}
      {/* <div className='absolute w-full h-full border-4 border-yellow-900/40 rounded-2xl 
                     backdrop-blur-lg bg-gradient-to-br from-white/20 via-amber-50/15 to-transparent
                     shadow-2xl shadow-amber-900/30'></div> */}
      
      {/* Inner glass layer */}
      <div className='absolute w-full h-full border-2 border-gray-100/40 rounded-xl 
                     backdrop-blur-md bg-transparent/300
                     shadow-inner shadow-amber-900/20'></div>
      
      {/* Centered image */}
      <div className='relative z-10 w-[88%] h-[82%] flex items-center justify-center
                     backdrop-blur-sm bg-linear-to-br from-gray-700 to-amber-50/30
                     rounded-lg border border-white/50
                     shadow-lg shadow-amber-900/15'>
        <img 
          src={Heroimg}
          alt="layout"
          className='max-w-[90%] max-h-full object-contain p-3 rounded-2xl'
        />
      </div>
      
      {/* Positioned items around the edges */}
      
      {/* Top Left */}
<div className='absolute bottom-53 right-65 z-20 '>
  <div className='flex justify-between bg-white/5 backdrop-blur-md bg-opacity-  inset-4 px-3 py-2 rounded-lg shadow-lg border border-gray-200 bg-linear-30 min-w-[140px]'>
    <div className=' items-center gap-2 mb-1 p-2 backdrop-blur-4xl bg-white/35 border border-gray-200 rounded-lg'>
      <FiMail className='text-blue-500' />
    </div>
    <div>
        <p className='text-xs font-semibold text-gray-800'>Email Draft</p>
    <p className='text-[10px] text-gray-600'>Follow up sent</p>
    </div>
  </div>
</div>

{/* Top Right - 3s ping */}
<div className='absolute top-3 right-7 z-20'>
  <div className='flex justify-between bg-white/5 backdrop-blur-md bg-opacity- inset-4 px-3 py-2 rounded-lg shadow-lg border border-gray-200 bg-linear-30 min-w-[140px] animate-[ping_3s_ease-in-out_infinite]'>
    <div className='flex items-center gap-2 mb-1'>
      <FiCheckCircle className='text-green-500' />
      <p className='text-xs font-semibold text-gray-800'>5 Tasks Done</p>
    </div>
    <p className='text-[10px] text-gray-600'>Today's progress</p>
  </div>
</div>

{/* Bottom right - 1.5s ping (more urgent) */}
<div className='absolute bottom-3 right-7 z-24'>
  <div className='flex justify-between bg-white/5 backdrop-blur-md bg-opacity- inset-4 px-3 py-2 rounded-lg shadow-lg border border-gray-200 bg-linear-30 min-w-[140px] animate-[ping_1.5s_ease-in-out_infinite] opacity-75'>
    <div className='items-center gap-2 mb-1 p-2 backdrop-blur-4xl bg-white/35 border border-gray-200 rounded-lg'>
      <FiClock className='flex text-white items-center justify-center' />
    </div>
    <div className='text-[10px] text-gray-100 font-medium font-roboto'>
      <p>Meeting</p>
      <p>In 30 minutes</p>
    </div>
  </div>
</div>

{/* Bottom left - 2s ping */}
<div className='absolute bottom-3 left-3 z-20'>
  <div className='flex font-roboto justify-between bg-white/5 backdrop-blur-md bg-opacity- inset-4 px-3 py-2 rounded-lg border border-gray-200 bg-linear-30 min-w-[140px] animate-[ping_5s_ease-in-out_infinite]'>
    <div className='flex items-center gap-2 mb-1'>
      <FiTarget className='text-red-500' />
      <p className='text-xs font-semibold text-gray-800'>Deadline</p>
    </div>
    <p className='text-[10px] text-gray-600'>Tomorrow, 10 AM</p>
  </div>
</div>
{/* double pingss  */}


      
    </div>
  )
}

export default HeroLayout