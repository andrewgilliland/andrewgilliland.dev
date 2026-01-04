---
title: "From React to SwiftUI"
date: "2023-06-23"
excerpt: "Some basic concepts to transfer from React knowledge to building SwiftUI apps"
draft: true
---

## Intro

A little over two years ago, I was tasked to start adding features to a project that was in React Native. Transferring React knowledge to React Native was very direct, but learned that the mobile application development had different sets of challenges that did not come with web application development. React Native came with a whole environment of new prebuilt components and there is no dom to work with like there is in the browser.

## Views are Components

Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptatem odio atque alias amet, iste dignissimos doloribus corporis tempore minus commodi nobis sapiente unde sunt laboriosam, fugit illo! Illum, eos consequuntur corporis libero sequi dolorem ipsam, repellendus impedit laboriosam modi expedita atque alias praesentium dolor?

### React Component

```javascript
import React from "react";

const ContentComponent = () => {
  return (
    <div>
      <h1>Hello, world!</h1>
    </div>
  );
};

export default ContentComponent;
```

### SwiftUI View

```swift
import SwiftUI

struct ContentView: View {
    var body: some View {
            Text("Hello, world!")
    }
}
```

## Basic State Management

Harum ex vero facere placeat doloremque? Eaque autem nam, repellat saepe dolor recusandae. Quas consequuntur nemo dolores perferendis! Hic similique nobis, amet deserunt id doloribus repellendus sequi nemo tempore veniam aliquam dicta libero non optio voluptates vel dolore asperiores minima mollitia qui sed fuga dolorum doloremque. Perferendis quia tenetur omnis quidem magni, culpa delectus minus. Quas quidem beatae voluptatum molestias impedit sunt expedita repellendus dignissimos? Sit et aperiam nemo impedit sapiente, possimus consequuntur optio culpa perspiciatis autem voluptatem adipisci, quam dolore consequatur libero rerum illo pariatur modi natus laudantium? Nobis, quod veritatis tenetur numquam eligendi vitae deserunt quo nesciunt exercitationem possimus vero, qui ex placeat veniam, aliquid omnis aperiam rem aspernatur. Voluptatibus, ipsam, eligendi itaque veritatis, nihil rerum reiciendis ab aliquam tempore in labore quam fugiat ipsa cum!

### @State vs useState

## Passing Properties Through Views

Quas obcaecati magni temporibus in, asperiores quam maxime! Saepe vel ipsum mollitia, iusto eum, repudiandae eligendi quae quasi voluptatem obcaecati aperiam temporibus sapiente voluptas cumque officiis voluptates reprehenderit provident facere. Voluptatibus ducimus debitis corporis obcaecati at nostrum ipsum ea odit assumenda laboriosam corrupti reiciendis, quidem voluptas aut magnam id alias, libero sit quam vero excepturi nulla voluptatem facilis. Numquam cupiditate labore sunt veniam nulla?

- Item 1
- Item 2
- Item 3
