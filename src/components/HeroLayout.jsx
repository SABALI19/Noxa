import React from 'react'
import Heroimg from '../assets/img/noxa-layout.png'
import { FiMail, FiCheckCircle, FiClock, FiTarget } from 'react-icons/fi'

const HeroLayout = () => {
  return (
    <div className='relative flex justify-center items-center h-48 sm:h-52 md:h-60 w-full overflow-visible'>
      
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
          className='max-w-[90%] max-h-full object-contain p-2 md:p-3 rounded-xl md:rounded-2xl'
        />
      </div>
      
      {/* Top Left - Email Draft */}
      <div className='absolute top-2 left-2 sm:top-3 sm:left-3 md:top-4 md:left-4 z-20'>
        <div className='flex bg-white/90 backdrop-blur-sm px-2 py-1.5 sm:px-2.5 sm:py-2 md:px-3 md:py-2 rounded-lg shadow-lg border border-gray-200/70 min-w-[110px] sm:min-w-[120px] md:min-w-[130px] lg:min-w-[140px]'>
          <div className='flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 mr-2 bg-white/70 border border-gray-200 rounded-lg'>
            <FiMail className='text-blue-500 text-xs sm:text-sm md:text-base' />
          </div>
          <div className='flex-1 min-w-0'>
            <p className='text-[10px] sm:text-[11px] md:text-xs font-semibold text-gray-800 truncate'>Email Draft</p>
            <p className='text-[8px] sm:text-[9px] md:text-[10px] text-gray-600 truncate'>Follow up sent</p>
          </div>
        </div>
      </div>

      {/* Top Right - Tasks Done */}
      <div className='absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 z-20'>
        <div className='flex bg-white/90 backdrop-blur-sm px-2 py-1.5 sm:px-2.5 sm:py-2 md:px-3 md:py-2 rounded-lg shadow-lg border border-gray-200/70 min-w-[110px] sm:min-w-[120px] md:min-w-[130px] lg:min-w-[140px] animate-[ping_3s_ease-in-out_infinite]'>
          <div className='flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 mr-2'>
            <FiCheckCircle className='text-green-500 text-xs sm:text-sm md:text-base' />
          </div>
          <div className='flex-1 min-w-0'>
            <p className='text-[10px] sm:text-[11px] md:text-xs font-semibold text-gray-800 truncate'>5 Tasks Done</p>
            <p className='text-[8px] sm:text-[9px] md:text-[10px] text-gray-600 truncate'>Today's progress</p>
          </div>
        </div>
      </div>

      {/* Bottom Right - Meeting */}
      <div className='absolute bottom-2 right-2 sm:bottom-3 sm:right-3 md:bottom-4 md:right-4 z-24'>
        <div className='flex bg-white/90 backdrop-blur-sm px-2 py-1.5 sm:px-2.5 sm:py-2 md:px-3 md:py-2 rounded-lg shadow-lg border border-gray-200/70 min-w-[110px] sm:min-w-[120px] md:min-w-[130px] lg:min-w-[140px] animate-[ping_1.5s_ease-in-out_infinite] opacity-90'>
          <div className='flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 mr-2 bg-blue-100/70 border border-blue-200 rounded-lg'>
            <FiClock className='text-blue-500 text-xs sm:text-sm md:text-base' />
          </div>
          <div className='flex-1 min-w-0'>
            <p className='text-[10px] sm:text-[11px] md:text-xs font-medium text-gray-800 truncate'>Meeting</p>
            <p className='text-[8px] sm:text-[9px] md:text-[10px] text-gray-600 truncate'>In 30 minutes</p>
          </div>
        </div>
      </div>

      {/* Bottom Left - Deadline */}
      <div className='absolute bottom-2 left-2 sm:bottom-3 sm:left-3 md:bottom-4 md:left-4 z-20'>
        <div className='flex bg-white/90 backdrop-blur-sm px-2 py-1.5 sm:px-2.5 sm:py-2 md:px-3 md:py-2 rounded-lg shadow-lg border border-gray-200/70 min-w-[110px] sm:min-w-[120px] md:min-w-[130px] lg:min-w-[140px] animate-[ping_2s_ease-in-out_infinite]'>
          <div className='flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 mr-2'>
            <FiTarget className='text-red-500 text-xs sm:text-sm md:text-base' />
          </div>
          <div className='flex-1 min-w-0'>
            <p className='text-[10px] sm:text-[11px] md:text-xs font-semibold text-gray-800 truncate'>Deadline</p>
            <p className='text-[8px] sm:text-[9px] md:text-[10px] text-gray-600 truncate'>Tomorrow, 10 AM</p>
          </div>
        </div>
      </div>

    </div>
  )
}

export default HeroLayout