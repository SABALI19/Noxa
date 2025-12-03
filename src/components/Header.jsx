import React, { useState } from 'react' // Add useState for controlled input
import Heading from '../assets/logo-items/logo-dark-transparent.png'
import Button from './Button'
import { FiSearch } from 'react-icons/fi'
import Input from '../components/common/input' // Import your Input component
import Image from '../assets/img/way-forward.png'
import NotificationBell from './notifications/NotificationBell'

const Header = ({
  Logo = Heading,
  // profile = {ProfileImage},
  // backgroundColor = "#F5F5F5",
  height = "h-14",
  className = "",
  // image={},
  // notificationCount = 0,
  logoHeight = "h-12",
  logoWidth = "w-[120px]",
  altText = "Noxa",
  onSearch, // Optional callback for search
}) => {
  const [searchValue, setSearchValue] = useState("")

  const handleSearchChange = (e) => {
    setSearchValue(e.target.value)
    // Call onSearch callback if provided
    if (onSearch) {
      onSearch(e.target.value)
    }
  }

  return (
    <div className={`w-full ${height} ${className} p-4 flex items-center justify-between gap-4 bg-[#F5F5F5] shadow-lg shadow-blue-500/50`}>
      
      {/* Logo */}
      {Logo && (
        <img
          src={Logo}
          alt={altText}
          className={`${logoHeight} ${logoWidth} object-contain`}
        />
      )}

      {/* Button */}
      <Button variant="primary" size="sm" className='rounded-lg'>
        + Quick Add
      </Button>

      {/* Search Input using reusable Input component */}
      <div className="w-full max-w-md">
        <Input
          type="text"
          value={searchValue}
          onChange={handleSearchChange}
          placeholder="Search tasks, notes, reminders..."
          icon={<FiSearch />}
          iconPosition="left"
          className="py-2" // Additional styling if needed
        />
      </div>

      {/* Bell icon and Profile image together */}
      <div className="flex items-center gap-8">
        {/* Bell Icon Container */}
        <NotificationBell count={3}/> 
        <NotificationBell count={0}/> 

        {/* <div className="relative">
          <FiBell className="text-gray-600 text-xl" /> */}
          {/* Optional notification badge */}
          {/* <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            3
          </span>
        </div> */}
        
        {/* Profile Image */}
        {Image && (
          <img 
            src={Image} 
            alt="Profile" 
            className="h-7 w-7 rounded-full object-cover border-2 border-gray-300"
          />
        )}
        <select name="" id=""
        className='outline-none text-gray-500' 
        >

        </select>
      </div>
    </div>
  )
}

export default Header