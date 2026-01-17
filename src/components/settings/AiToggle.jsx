import React from 'react'
import { GiRobotGolem } from "react-icons/gi";
import Button from '../Button';

const AiToggle = () => {
  return (
    <div>
       <Button 
       variant='artifitial'
       size=''
       className='rounded-full animate-fadeIn animate-rotate hover:bg-[#3D9B9B]  hover:text-white'>
         <GiRobotGolem className='text-2xl '/>
       </Button>
    </div>
  )
}

export default AiToggle