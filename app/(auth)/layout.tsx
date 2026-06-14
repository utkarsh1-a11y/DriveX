import React from "react";
import Image from "next/image";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen">
      <section className="hidden w-1/2 items-center justify-center bg-black p-10 lg:flex xl:w-2/5">
        <div className="flex max-h-[800px] max-w-[430px] flex-col justify-center space-y-12">
          <div className="flex items-center gap-3">
            <Image
              src="/assets/icons/logo-drivex.png"
              alt="logo"
              width={50}
              height={50}
              className="h-auto"
            />
            <span className="text-[28px] font-bold text-white">
              Drive<span className="text-gray-400">X</span>
            </span>
          </div>

          <div className="space-y-5 text-white">
            <h1 className="h1">Manage your files the best way</h1>
            <p className="body-1">
              This is a place where you can store all your documents.
            </p>
          </div>
          <Image
            src="/assets/images/files.png"
            alt="Files"
            width={342}
            height={342}
            className="transition-all hover:rotate-2 hover:scale-105"
          />
        </div>
      </section>

      <section className="flex flex-1 flex-col items-center bg-white p-4 py-10 lg:justify-center lg:p-10 lg:py-0">
        <div className="mb-16 flex items-center gap-3 lg:hidden">
          <Image
            src="/assets/icons/logo-drivex.png"
            alt="logo"
            width={44}
            height={44}
            className="h-auto w-[40px] sm:w-[44px]"
          />
          <span className="text-[24px] font-bold text-black sm:text-[28px]">
            Drive<span className="text-gray-400">X</span>
          </span>
        </div>

        {children}
      </section>
    </div>
  );
};

export default Layout;
