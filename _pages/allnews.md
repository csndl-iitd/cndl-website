---
title: "CNDL@IITJ - News"
layout: textlay
sitemap: false
permalink: /allnews.html
---

# News

{% assign sorted_news = site.data.news | sort: "date" | reverse %}

{% for article in sorted_news %}
---
{{ article.date }}
{{ article.headline | markdownify}}
{% endfor %}
