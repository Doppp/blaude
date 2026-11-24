---
title: What happens when you open a link
date: 2026-11-22
description: Four round trips between tapping a link and seeing a page: DNS, TCP, TLS and HTTP.
tags: [web, networking]
readingMinutes: 6
url: https://claude.ai/artifact/KbK4HARDNTL3p1dzS6KS5a
---
You tap a link and a page appears. In between, your browser has a short, very polite conversation with two other computers. Most of the wait is that conversation, not the download.

Each exchange is a round trip: a message out, a reply back. Round trips are cheap on the same street and expensive across an ocean, so the number of them matters more than how fast your connection is.

## The conversation

Press Play to watch a first visit to `notes.example`, then switch to a return visit.

::: sequence
{
  "alt": "Sequence of messages between browser, DNS resolver and server",
  "modesLabel": "Visit",
  "counter": "Round trips",
  "lanes": [
    { "name": "Browser" },
    { "name": "DNS resolver", "short": "Resolver" },
    { "name": "Server" }
  ],
  "modes": [
    {
      "name": "First visit",
      "intro": { "title": "Ready", "text": "Nothing is cached yet. Press Play." },
      "messages": [
        { "from": "Browser", "to": "DNS resolver", "label": "notes.example?", "group": "DNS", "title": "Ask for the address", "text": "The browser has never seen notes.example, so it asks a DNS resolver which IP address the name points to." },
        { "from": "DNS resolver", "to": "Browser", "label": "203.0.113.10", "group": "DNS", "title": "Address found", "text": "The resolver answers with an IP address. The browser caches it for next time." },
        { "from": "Browser", "to": "Server", "label": "SYN", "group": "TCP", "title": "Open a connection", "text": "The browser asks the server to open a TCP connection." },
        { "from": "Server", "to": "Browser", "label": "SYN-ACK", "group": "TCP", "title": "Server agrees", "text": "The server acknowledges. One more round trip done, and still no page." },
        { "from": "Browser", "to": "Server", "label": "ClientHello", "group": "TLS", "title": "Start encryption", "text": "The browser proposes how to encrypt the connection and sends its half of a key exchange." },
        { "from": "Server", "to": "Browser", "label": "ServerHello + cert", "group": "TLS", "title": "Server proves who it is", "text": "The server picks the settings, sends its certificate, and finishes its half of the key exchange. With TLS 1.3 this takes one round trip." },
        { "from": "Browser", "to": "Server", "label": "GET /", "group": "HTTP", "title": "Ask for the page", "text": "Now encrypted, the browser finally asks for the page." },
        { "from": "Server", "to": "Browser", "label": "200 OK + HTML", "group": "HTTP", "title": "The page arrives", "text": "The first bytes of HTML arrive after four round trips. The browser starts rendering while the rest streams in." }
      ]
    },
    {
      "name": "Return visit",
      "intro": { "title": "Ready", "text": "The browser visited a moment ago. Press Play." },
      "messages": [
        { "from": "Browser", "to": "Server", "label": "GET /", "group": "HTTP", "title": "Straight to the request", "text": "The address is cached and the encrypted connection is still open, so the browser skips DNS, TCP and TLS." },
        { "from": "Server", "to": "Browser", "label": "200 OK + HTML", "group": "HTTP", "title": "One round trip", "text": "The page arrives after a single round trip. Same server, same network, a fraction of the wait." }
      ]
    }
  ]
}
:::

Four round trips before the first byte of the page arrives. A return visit skips most of them, because the browser remembers the address and can keep the connection open.

::: callout tip
**Why this matters.** At 80 ms per round trip, four of them cost a third of a second before any HTML arrives. Cutting round trips is usually a bigger win than shrinking files.
:::

## What is actually sent

Once the connection is ready, the request itself is small. Shown here as HTTP/1.1 text for readability; HTTP/2 and HTTP/3 send the same fields in binary.

::: codetabs
{
  "label": "Request and response",
  "files": [
    { "name": "request", "lang": "http", "code": "GET / HTTP/1.1\nHost: notes.example\nUser-Agent: Mozilla/5.0 (iPhone; ...)\nAccept: text/html\nAccept-Encoding: br, gzip\n# no body: a GET only asks" },
    { "name": "response", "lang": "http", "code": "HTTP/1.1 200 OK\nContent-Type: text/html; charset=utf-8\nContent-Encoding: br\nCache-Control: max-age=300\n\n<!doctype html>\n<html lang=\"en\">\n  <head><title>Notes</title></head>\n  <!-- the browser starts rendering here -->" }
  ]
}
:::

## Measuring it yourself

Two commands show every stage. `dig` asks DNS for the address, and curl can print how long each step took.

::: terminal
{
  "title": "~",
  "label": "Terminal: measuring a page load with dig and curl",
  "lines": [
    ["cmd", "dig +short notes.example"],
    ["ok", "203.0.113.10"],
    ["cmd", "curl -so /dev/null -w @timing.txt https://notes.example"],
    ["out", "dns lookup      0.012s"],
    ["out", "tcp connected   0.031s"],
    ["out", "tls done        0.058s"],
    ["ok", "first byte      0.084s"]
  ]
}
:::

Each figure from curl is cumulative, so the gaps tell the story: about 12 ms finding the address, 19 ms connecting, 27 ms on encryption, and 26 ms waiting for the server.

::: callout warning
**Watch the last gap.** If time to first byte is large while the others are small, the network is fine. The server is slow to answer.
:::
