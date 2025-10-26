import { Trophy, MapPin, Phone, Mail, Clock, Users, Calendar, MessageCircle, Instagram, Youtube } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          
          {/* DLOB Brand & Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="rounded-full bg-blue-600 p-2">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <h4 className="text-xl font-bold">DLOB</h4>
            </div>
            <p className="text-gray-400 mb-4 text-sm leading-relaxed">
              Komunitas badminton terdepan dengan teknologi smart untuk mengelola 
              kehadiran, pertandingan, dan pembayaran secara otomatis.
            </p>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Users className="h-4 w-4" />
              <span>50+ Active Members</span>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h5 className="text-lg font-semibold mb-4 text-white">Contact Person</h5>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-3">
                <Phone className="h-4 w-4 mt-0.5 text-blue-400 shrink-0" />
                <div>
                  <p className="text-gray-300 font-medium">Admin DLOB</p>
                  <p className="text-gray-400">+62 812-7073-7272</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <MessageCircle className="h-4 w-4 mt-0.5 text-green-400 shrink-0" />
                <div>
                  <p className="text-gray-300 font-medium">WhatsApp Group</p>
                  <p className="text-gray-400">Join our community chat</p>
                </div>
              </div>
            </div>
            
            {/* Social Media */}
            <div className="mt-4">
              <h6 className="text-sm font-semibold mb-3 text-white">Follow Us</h6>
              <div className="space-y-2 text-sm">
                <a href="https://www.instagram.com/dlob.channel/" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 text-gray-400 hover:text-pink-400 transition-colors">
                  <Instagram className="h-4 w-4 shrink-0" />
                  <span>@dlob.channel</span>
                </a>
                <a href="https://www.tiktok.com/@dlobchannel" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 text-gray-400 hover:text-purple-400 transition-colors">
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                  <span>@dlobchannel</span>
                </a>
                <a href="https://www.youtube.com/@dlobchannel" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 text-gray-400 hover:text-red-400 transition-colors">
                  <Youtube className="h-4 w-4 shrink-0" />
                  <span>@dlobchannel</span>
                </a>
              </div>
            </div>
          </div>

          {/* Location & Schedule */}
          <div>
            <h5 className="text-lg font-semibold mb-4 text-white">Lokasi & Jadwal</h5>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 mt-0.5 text-blue-400 shrink-0" />
                <div>
                  <p className="text-gray-300 font-medium">Venue Utama</p>
                  <p className="text-gray-400">
                    GOR Badminton Wisma Harapan<br />
                    Jl. Wisma Lantana IV No.D07-No 49<br />
                    RT.006/RW.011, Gembor<br />
                    Kec. Periuk, Kota Tangerang<br />
                    Banten 15133
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Calendar className="h-4 w-4 mt-0.5 text-green-400 shrink-0" />
                <div>
                  <p className="text-gray-300 font-medium">Jadwal Rutin</p>
                  <p className="text-gray-400">Setiap Sabtu, 20:00 - 23:00 WIB</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links & Info */}
          <div>
            <h5 className="text-lg font-semibold mb-4 text-white">Quick Links</h5>
            <div className="space-y-2 text-sm">
              <a href="/about" className="block text-gray-400 hover:text-blue-400 transition-colors">
                About
              </a>
              <a href="/hall-of-fame" className="block text-gray-400 hover:text-blue-400 transition-colors">
                Hall of Fame
              </a>
              <a href="/gallery" className="block text-gray-400 hover:text-blue-400 transition-colors">
                Gallery
              </a>
            </div>
            
            {/* Legal Links */}
            <div className="mt-4">
              <h6 className="text-sm font-semibold mb-3 text-white">Legal</h6>
              <div className="space-y-2 text-sm">
                <a href="/terms" className="block text-gray-400 hover:text-blue-400 transition-colors">
                  Terms of Service
                </a>
                <a href="/privacy" className="block text-gray-400 hover:text-blue-400 transition-colors">
                  Privacy Policy
                </a>
              </div>
            </div>
            
            {/* Interactive Map */}
            <div className="mt-4 p-3 bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-medium text-gray-300">Location Map</span>
              </div>
              <div className="rounded overflow-hidden">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.6783531751307!2d106.57868617499004!3d-6.173800093813582!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69ffa7e2cd5549%3A0x15c214ab8b458bf3!2sGOR%20Badminton%20Wisma%20Harapan!5e0!3m2!1sen!2sid!4v1761472143596!5m2!1sen!2sid" 
                  width="100%" 
                  height="120" 
                  style={{border:0}} 
                  allowFullScreen={true}
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  className="rounded"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 pt-6">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
            <div className="text-sm text-gray-400">
              <p>&copy; 2025 DLOB Community. All rights reserved.</p>
              <div className="flex items-center space-x-4 mt-2">
                <a href="/terms" className="hover:text-blue-400 transition-colors">
                  Terms of Service
                </a>
                <span>|</span>
                <a href="/privacy" className="hover:text-blue-400 transition-colors">
                  Privacy Policy
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <span>Powered by AI & Smart Technology</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>System Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}