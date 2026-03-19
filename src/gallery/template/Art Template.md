
---
<%*
	let title = tp.file.title 
	if (title.startsWith("Untitled")) {
		title = await tp.system.prompt("Title");
		await tp.file.rename(`${title}`);
	}
%>
title: <%* tR += `${title}` %>
tags:  
layout: "art.liquid"
date: <% tp.file.creation_date(yyyy-MM-dd) %>
image: 
alt:

---


this is the second one and the text is so long woah this is such a long text