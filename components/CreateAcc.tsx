import Image from "next/image";
import React from "react";
import people from "@/public/people.svg";
import Link from "next/link";

const CreateAcc = ({ className = "" }) => {
  return (
    <div
      className={`w-[8rem] md:w-[9rem] lg:w-[10.5rem] flex items-center ${className}`}
    >
      <Link
        href="/auth/signup"
      >
        <div className="flex items-center gap-[0.5rem] md:gap-[0.625rem]">
          <Image
            src={people}
            alt="Create Account"
            className="w-[16px] h-[16px] md:w-[18px] md:h-[18px] lg:w-[20px] lg:h-[20px] inline-block"
          />
          <span className="text-[1rem] md:text-[1.125rem] lg:text-[1.25rem] whitespace-nowrap inline-block">
            Create Account
          </span>
        </div>
      </Link>
    </div>
  );
};

export default CreateAcc;
