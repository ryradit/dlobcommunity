"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const CalendarDay: React.FC<{ day: number | string; isHeader?: boolean; isSelected?: boolean; isSaturday?: boolean; onClick?: () => void }> = ({
  day,
  isHeader,
  isSelected,
  isSaturday,
  onClick,
}) => {
  const randomBgIndigo =
    !isHeader && isSaturday && Math.random() < 0.3
      ? "bg-indigo-500 text-white "
      : "text-gray-700";

  const isDisabled = !isHeader && !isSaturday;

  return (
    <div
      onClick={!isDisabled ? onClick : undefined}
      className={`col-span-1 row-span-1 flex h-8 w-8 items-center justify-center transition-colors ${
        isHeader ? "" : "rounded-xl"
      } ${isSelected ? "bg-indigo-500 text-white" : randomBgIndigo} ${
        isDisabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer hover:bg-indigo-100"
      }`}
    >
      <span className={`font-medium ${isHeader ? "text-xs" : "text-sm"}`}>
        {day}
      </span>
    </div>
  );
};

interface CalendarProps {
  language?: 'en' | 'id';
  onDateSelect?: (date: string) => void;
}

export function Calendar({ language = 'en', onDateSelect }: CalendarProps) {
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString("default", { month: "long" });
  const currentYear = currentDate.getFullYear();
  const firstDayOfMonth = new Date(currentYear, currentDate.getMonth(), 1);
  const firstDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = new Date(
    currentYear,
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const handleDateSelect = (day: number) => {
    setSelectedDate(day);
    const selectedDateString = `${currentMonth} ${day}, ${currentYear}`;
    onDateSelect?.(selectedDateString);
  };

  const handleSendWhatsApp = () => {
    if (!selectedDate) {
      alert(language === 'en' ? 'Please select a date first' : 'Silakan pilih tanggal terlebih dahulu');
      return;
    }

    const message = language === 'id' 
      ? `Halo Kak Tian, saya ingin bergabung dengan komunitas DLOB pada tanggal ${currentMonth} ${selectedDate}, ${currentYear}. Terima kasih.`
      : `Hi Kak Tian, I would like to join the DLOB community on ${currentMonth} ${selectedDate}, ${currentYear}. Thank you.`;
    
    const phoneNumber = "6281270737272";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const renderCalendarDays = () => {
    let days: React.ReactNode[] = [
      ...dayNames.map((day, i) => (
        <CalendarDay key={`header-${day}`} day={day} isHeader />
      )),
      ...Array(firstDayOfWeek).map((_, i) => (
        <div
          key={`empty-start-${i}`}
          className="col-span-1 row-span-1 h-8 w-8"
        />
      )),
      ...Array(daysInMonth)
        .fill(null)
        .map((_, i) => {
          const dayOfMonth = i + 1;
          const dayOfWeek = (firstDayOfWeek + i) % 7;
          const isSaturday = dayOfWeek === 6; // Saturday is 6 (0=Sunday, 6=Saturday)
          
          return (
            <CalendarDay 
              key={`date-${dayOfMonth}`} 
              day={dayOfMonth}
              isSelected={selectedDate === dayOfMonth}
              isSaturday={isSaturday}
              onClick={isSaturday ? () => handleDateSelect(dayOfMonth) : undefined}
            />
          );
        }),
    ];

    return days;
  };

  return (
    <div className="group relative flex flex-col rounded-2xl border border-gray-200 bg-white p-6 hover:bg-gray-50 overflow-hidden w-full">
      <div className="absolute bottom-4 right-6 z-[999] flex h-12 w-12 rotate-6 items-center justify-center rounded-full bg-indigo-500 opacity-0 transition-all duration-300 ease-in-out group-hover:translate-y-[-8px] group-hover:rotate-0 group-hover:opacity-100">
        <svg
          className="h-6 w-6 text-white"
          width="24"
          height="24"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M17.25 15.25V6.75H8.75"
          ></path>
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M17 7L6.75 17.25"
          ></path>
        </svg>
      </div>

      <div className="grid h-full gap-5">
        <div>
          <h2 className="mb-4 text-lg md:text-3xl font-semibold text-gray-900">
            {language === 'en' ? 'Any questions about DLOB?' : 'Ada pertanyaan tentang DLOB?'}
          </h2>
          <p className="mb-2 text-xs md:text-base text-gray-600">
            {language === 'en' ? 'Feel free to reach out to us!' : 'Jangan ragu untuk menghubungi kami!'}
          </p>
          <p className="mb-3 text-xs md:text-sm text-indigo-600 font-medium">
            {language === 'en' ? '📅 Available on Saturdays only' : '📅 Hanya tersedia pada hari Sabtu'}
          </p>
          <button
            onClick={handleSendWhatsApp}
            disabled={!selectedDate}
            className={`mt-3 px-6 py-2 rounded-2xl font-semibold flex items-center gap-2 transition-all duration-300 ${
              selectedDate
                ? 'bg-indigo-500 text-white hover:bg-indigo-600 hover:shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {language === 'en' ? 'Join Now' : 'Gabung Sekarang'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="transition-all duration-500 ease-out md:group-hover:-right-12 md:group-hover:top-5">
          <div>
            <div className="h-full w-full md:w-[550px] rounded-[24px] border border-gray-200 p-2 transition-colors duration-100 group-hover:border-indigo-400 bg-white">
              <div
                className="h-full rounded-2xl border border-gray-100 p-3"
                style={{ boxShadow: "0px 2px 1.5px 0px rgba(0,0,0,0.05) inset" }}
              >
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">
                      {currentMonth}, {currentYear}
                    </span>
                  </p>
                  <span className="h-1 w-1 rounded-full bg-gray-300">&nbsp;</span>
                  <p className="text-xs text-gray-600">
                    {selectedDate ? `${currentMonth} ${selectedDate}` : (language === 'en' ? 'Select a date' : 'Pilih tanggal')}
                  </p>
                </div>
                <div className="mt-4 grid grid-cols-7 grid-rows-5 gap-2 px-4">
                  {renderCalendarDays()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
