import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import React, { JSX } from "react";
import Logo from "@/components/Logo";
import testimonialImage from "@/public/signupTestmonial.svg";
import appleLogo from "@/public/icons8-apple.svg";
import googleLogo from "@/public/icons8-google.svg";
import facebookLogo from "@/public/icons8-facebook.svg";
import githubLogo from "@/public/icons8-github.svg";

export default function SignupPage(): JSX.Element {
  return (
    <div className="h-screen bg-[#080a0c] flex items-center justify-center overflow-hidden">
      <div className="flex flex-col md:flex-row max-w-[1728px] w-full h-[95vh] md:h-[1117px] justify-around items-center md:px-8">
        {/* Left side - Sign up form - made more bounded */}
        <div className="flex flex-col items-start justify-center max-w-sm md:max-w-xs lg:max-w-sm shrink-0">
          <div className="w-[] px-6 md:px-0">
            <div className="flex flex-col w-full items-start gap-[31px]">
              {/* Logo */}
              <div className="inline-flex items-center gap-2">
                <Logo />
              </div>

              {/* Heading */}
              <div className="flex flex-col items-start gap-[11px] w-full">
                <h1 className="text-white text-[28px] font-medium mt-[-1px]">
                  Create a free account
                </h1>
                <p className="text-[#afafaf] text-base font-medium">
                  Join LinkHive – Shorten Smarter, Share Faster, Track Better
                </p>
              </div>

              {/* Form - made more compact */}
              <div className="flex flex-col w-full items-center gap-[30px]">
                <div className="flex flex-col items-start gap-6 w-full">
                  {/* Name field */}
                  <div className="flex flex-col items-start gap-[11px] w-full">
                    <label className="text-[#e6e6e6] text-xl font-semibold mt-[-1px]">
                      Name
                    </label>
                    <Input
                      placeholder="Enter your name"
                      className="pl-6 py-4 h-auto rounded-[42px] text-[#a7a7a7] text-base bg-transparent"
                    />
                  </div>

                  {/* Email field */}
                  <div className="flex flex-col items-start gap-[11px] w-full">
                    <label className="text-[#e6e6e6] text-xl font-semibold mt-[-1px]">
                      Email
                    </label>
                    <Input
                      placeholder="Enter your E-mail"
                      className="pl-6 py-4 h-auto rounded-[42px] text-[#a7a7a7] text-base bg-transparent"
                    />
                  </div>

                  {/* Password field */}
                  <div className="flex flex-col items-start gap-[11px] w-full">
                    <label className="text-[#e6e6e6] text-xl font-semibold mt-[-1px]">
                      Password
                    </label>
                    <Input
                      type="password"
                      placeholder="Enter password"
                      className="pl-6 py-4 h-auto rounded-[42px] text-[#a7a7a7] text-base bg-transparent"
                    />
                  </div>
                </div>

                {/* Buttons and social login */}
                <div className="flex flex-col items-center gap-7 w-full">
                  <Button className="w-full px-[101px] py-4 h-auto rounded-[42px] bg-white text-black font-semibold text-base">
                    Create my account
                  </Button>

                  {/* Divider */}
                  <div className="flex items-center w-full">
                    <Separator className="w-full" />
                    <span className="px-1 text-[#a7a7a7] text-xs bg-[#080a0c] absolute left-1/2 transform -translate-x-1/2">
                      or continue with
                    </span>
                  </div>

                  {/* Social login buttons */}
                  <div className="flex items-center justify-center gap-4 w-full">
                    {/* Google */}
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-12 h-12 rounded-full bg-white p-0 flex items-center justify-center border border-gray-200 hover:bg-gray-100"
                    >
                      <Image
                        src={googleLogo}
                        alt="Google"
                        width={24}
                        height={24}
                        className="object-contain"
                      />
                    </Button>

                    {/* GitHub */}
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-12 h-12 rounded-full bg-white p-0 flex items-center justify-center border border-gray-200 hover:bg-gray-100"
                    >
                      <Image
                        src={githubLogo}
                        alt="GitHub"
                        width={24}
                        height={24}
                        className="object-contain"
                      />
                    </Button>

                    {/* Facebook */}
                    <Button
                      size="icon"
                      className="w-12 h-12 rounded-full bg-[#1977f2] p-0 flex items-center justify-center hover:bg-[#1466d8]"
                    >
                      <Image
                        src={facebookLogo}
                        alt="Facebook"
                        width={24}
                        height={24}
                        className="object-contain"
                      />
                    </Button>

                    {/* Apple */}
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-12 h-12 rounded-full bg-black p-0 flex items-center justify-center border border-gray-700 hover:bg-gray-900"
                    >
                      <Image
                        src={appleLogo}
                        alt="Apple"
                        width={24}
                        height={24}
                        className="object-contain"
                      />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Login link */}
            <div className="w-full text-center mt-8 text-base">
              <span className="text-[#a7a7a7]">Already have an account? </span>
              <span className="text-white cursor-pointer">Log In</span>
            </div>
          </div>
        </div>

        {/* Right side - Testimonial */}
        <div className="hidden md:block w-full max-w-xl">
          <div className="relative w-full aspect-[4/5]">
            <Image
              src={testimonialImage}
              alt="Testimonial"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
}
