import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlayCircle, Code, BookOpen, MessageCircle } from 'lucide-react';

interface LessonContent {
  id: string;
  title: string;
  videoUrl: string;
  theory: string;
  practicalGuide: string;
  initialCode: string;
}

const lessonData: LessonContent = {
  id: '1',
  title: 'Getting Started with Arduino',
  videoUrl: 'https://example.com/video1.mp4',
  theory: `
# Introduction to Arduino

Arduino is an open-source electronics platform based on easy-to-use hardware and software. It's intended for anyone making interactive projects.

## What You'll Learn
- Basic Arduino board components
- Setting up your Arduino IDE
- Understanding digital pins
- Writing your first sketch

## Key Concepts
1. **Digital Pins**: Arduino boards have several digital pins that can be used as inputs or outputs.
2. **Sketch**: A program written for Arduino is called a sketch.
3. **Setup() and Loop()**: Every Arduino sketch has two main functions:
   - setup() runs once at the start
   - loop() runs repeatedly after setup

## Components Needed
- Arduino UNO board
- USB cable
- LED
- 220Ω resistor
- Breadboard
- Jumper wires
  `,
  practicalGuide: `
# Building Your First LED Circuit

## Step-by-Step Guide

### 1. Gather Your Components
- [ ] Arduino UNO
- [ ] USB cable
- [ ] LED
- [ ] 220Ω resistor
- [ ] Breadboard
- [ ] 2 jumper wires

### 2. Circuit Assembly
1. Insert the LED into the breadboard
   - Long leg (anode) in one row
   - Short leg (cathode) in another row

2. Connect the resistor
   - One end to the LED's cathode
   - Other end to any row

3. Wire connections
   - Connect Digital Pin 13 to LED's anode
   - Connect GND to the resistor's free end

### 3. Upload the Code
1. Open Arduino IDE
2. Copy the provided code
3. Select your board and port
4. Click upload

### 4. Testing
- The LED should blink
- If not, check:
  - LED orientation
  - Wire connections
  - Port selection
  `,
  initialCode: `
// Pin definitions
const int ledPin = 13;

void setup() {
  // Initialize digital pin as output
  pinMode(ledPin, OUTPUT);
}

void loop() {
  digitalWrite(ledPin, HIGH);  // Turn LED on
  delay(1000);                 // Wait 1 second
  digitalWrite(ledPin, LOW);   // Turn LED off
  delay(1000);                 // Wait 1 second
}
  `,
};

const LessonDetailPage = () => {
  const { courseId, lessonId } = useParams();
  const [code, setCode] = useState(lessonData.initialCode);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleRunCode = () => {
    setIsSimulating(true);
    // In a real app, this would connect to an Arduino simulator
    setTimeout(() => setIsSimulating(false), 2000);
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{lessonData.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="video" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="video" className="flex items-center gap-2">
                <PlayCircle className="h-4 w-4" />
                Video
              </TabsTrigger>
              <TabsTrigger value="theory" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Theory
              </TabsTrigger>
              <TabsTrigger value="practical" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                Practical
              </TabsTrigger>
              <TabsTrigger value="discussion" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Discussion
              </TabsTrigger>
            </TabsList>

            <TabsContent value="video" className="mt-4">
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <PlayCircle className="h-12 w-12" />
              </div>
            </TabsContent>

            <TabsContent value="theory" className="mt-4">
              <ScrollArea className="h-[600px] w-full rounded-md border p-4">
                <div className="prose dark:prose-invert max-w-none">
                  {lessonData.theory}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="practical" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <ScrollArea className="h-[600px] w-full rounded-md border p-4">
                    <div className="prose dark:prose-invert max-w-none">
                      {lessonData.practicalGuide}
                    </div>
                  </ScrollArea>
                </div>
                <div className="space-y-4">
                  <div className="relative">
                    <textarea
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full h-[400px] font-mono text-sm p-4 bg-muted rounded-lg"
                    />
                    <Button
                      onClick={handleRunCode}
                      disabled={isSimulating}
                      className="absolute top-2 right-2"
                    >
                      {isSimulating ? 'Running...' : 'Run Code'}
                    </Button>
                  </div>
                  <div className="bg-muted rounded-lg p-4 h-[160px]">
                    <h4 className="font-semibold mb-2">Serial Monitor</h4>
                    <div className="font-mono text-sm">
                      {isSimulating ? 'Simulating Arduino code...' : 'Ready'}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="discussion" className="mt-4">
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Discussion Forum</h3>
                <p className="text-muted-foreground">
                  Share your thoughts and questions about this lesson with other learners.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LessonDetailPage;
