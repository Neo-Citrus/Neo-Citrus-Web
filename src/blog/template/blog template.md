---
<%*
	let title = tp.file.title 
	if (title.startsWith("Untitled")) {
		title = await tp.system.prompt("Title");
		await tp.file.rename(`${title}`);
	}
%>
title: <%* tR += `${title}` %>
tags: blog
layout: "post.liquid"
date: <% tp.file.creation_date(yyyy-MM-dd) %>
---

this is the second one and the text is so long woah this is such a long text