---
title: "CNDL@IITJ - Publications"
layout: gridlay
sitemap: false
permalink: /publications-all/
---


# Deeper dive into all publications

{% assign sorted_publications = site.data.publications | sort: "year" | reverse %}

{% for publi in sorted_publications %}

<div class="row">
<div class="col-sm-4 clearfix">
  <img src="{{ publi.image }}" class="img-thumbnail" width="300px" style="float: left" />
</div>
<div class="col-sm-8 clearfix">
  <h4>{{ publi.title }}</h4>
  <p><b>Question:</b>{{ publi.question }}</p>
  <p><b>Impact: </b>{{ publi.impact }}</p>
  <p><em>{{ publi.authors }}</em></p>
  <p><strong><a href="{{ publi.link_url }}">{{ publi.link_display }}</a></strong></p>
  <p> {{ publi.news }}</p>
</div>
</div>
----

{% endfor %}