---
layout: post
published: true
category: The Workshop
tags:
- vagrant
title: 'Vagrant: Run commands from Rake as the vagrant user'
---

I was trying to find out a way of running some commands inside the Vagrant virtual machine as the ```vagrant``` user, not as ```root```, which is what the ```channel.sudo()``` method does. After a while of trying to find some documentation on the official Vagrant site, and finding none, I eventually found a call in the Vagrant source code for ```channel.execute()``` - which does run the passed commands as the ```vagrant``` user.

Job done, right?

Well, not really. I did what all good citizens of the open source community should do, which was to fork the Vagrant documentation repo, update the documentation, and <a href="https://github.com/mitchellh/vagrant/pull/1214" target="_blank">submit a pull request</a>.

The 'Boy Scout' principal prevails - try to leave the campsite tidier than when you found it.
