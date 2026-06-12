import { Button } from '@/components/ui/button';
import { ArrowRight, Users, Activity, BarChart } from 'lucide-react';
import { Terminal } from './terminal';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main>
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl md:text-6xl">
                Build a Connected
                <span className="block text-orange-500">Remote Culture</span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                TeamPulp turns casual chats into organizational intelligence. 
                Pair your team for guided video connections and unlock insights 
                that drive trust and retention.
              </p>
              <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0">
                <Link href="/sign-up">
                  <Button
                    size="lg"
                    className="bg-orange-500 hover:bg-orange-600 text-white text-lg rounded-full"
                  >
                    Start Your First Ritual
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <Terminal />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            <div>
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                <Users className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium text-gray-900">
                  Smart Pairing
                </h2>
                <p className="mt-2 text-base text-gray-500">
                  Break down silos. Our algorithm pairs teammates cross-functionally 
                  to ensure everyone in your remote team feels seen and connected.
                </p>
              </div>
            </div>

            <div className="mt-10 lg:mt-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                <Activity className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium text-gray-900">
                  Guided Video Rituals
                </h2>
                <p className="mt-2 text-base text-gray-500">
                  High-energy, 15-minute chats modeled after PTI. No awkward 
                  silences, just genuine connection guided by dynamic prompts.
                </p>
              </div>
            </div>

            <div className="mt-10 lg:mt-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                <BarChart className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium text-gray-900">
                  Relationship Intelligence
                </h2>
                <p className="mt-2 text-base text-gray-500">
                  Go beyond surveys. AI analyzes connections to provide Bond Cards 
                  for individuals and Culture Health graphs for managers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Ready to strengthen your team?
              </h2>
              <p className="mt-3 max-w-3xl text-lg text-gray-500">
                Remote work shouldn't be lonely. TeamPulp helps distributed 
                teams build the same "watercooler" trust that in-person 
                teams enjoy, backed by data.
              </p>
            </div>
            <div className="mt-8 lg:mt-0 flex justify-center lg:justify-end">
              <Link href="/sign-up">
                <Button
                  size="lg"
                  className="bg-orange-500 hover:bg-orange-600 text-white text-lg rounded-full"
                >
                  Get Started Now
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
