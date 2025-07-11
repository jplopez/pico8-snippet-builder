# Pico-8 Snippet Builder

## What is this?

The Pico-8 Snippet Builder (Pis), is a web-based tool for pico-8 developers to generate one single .lua file with all the functions and snippets of code they need for a cartridge.

Pis saves time to reuse code, preventing having multiple copies of the same function everywhere. Just have one repository with all your snippets and generate a single .lua file with the functions you need.

## How to setup?

The tool must be run on a web-server. Any web-server should work, because Pis is made with plain HTML and JS, no frameworks or fancyness.

In the ```snippets/``` folder, you must have a ```snippets.json``` file listing all the sub-folders you want to be scanned for .lua files.

    
    [
    "core/",
    "lib-pico8/src/",
    "lib-pico8/src/oop/",
    "pew/src/",
    "state_machine/src/"
    ]
    

At the moment, Pis is programmed to only read folders under the ```snippets/``` folder. 

## How to use?

1.  **Load Pis** you just load the ```index.html``` file, and it will list all the .lua files found in the specified folders.

2.  **Select the Snippets** you want to merge using the checkbuttons left of the filename.
  
3.  **Build and download** by selecting one of the options in the bottom toolbar *Build File* of *Build Min File* if you prefer minimized code.

## Support and Troubleshooting

Just create an issue on the repository and I'll get back to you.

## Contribute

This repository is public. Feel free to clone, copy, distribute or contribute here.
