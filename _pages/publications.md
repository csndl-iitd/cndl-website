---
title: "CNDL@IITJ - Publications"
layout: gridlay
sitemap: false
permalink: /publications/
---


# Publications

## Group highlights

(See full list of [journal](#full-list-of-publications) and [conference](#conference-publications) publications or go to [Google Scholar](https://scholar.google.com/citations?user=swv4OdIAAAAJ&hl=en); you can also dive deeper into each publication [here]({{ site.baseurl }}{% link _pages/publications-all.md %}))

<!-- {% assign sorted_publications = site.data.publications %} -->
{% assign sorted_publications = site.data.publications | sort: "year" | reverse %}

{% assign number_printed = 0 %}
{% for publi in sorted_publications %}

{% assign even_odd = number_printed | modulo: 2 %}
{% if publi.highlight == 1 %}

{% if even_odd == 0 %}
<div class="row">
{% endif %}

<div class="col-sm-6 clearfix">
 <div class="well">
  <pubtit>{{ publi.title }}</pubtit>
  <img src="{{ publi.image }}" class="img-responsive" width="80%" style="float: center" />
  <p><b>Question:</b>{{ publi.question }}</p>
  <p><b>Impact: </b>{{ publi.impact }}</p>
  <p><em>{{ publi.authors }}</em></p>
  <p><strong><a href="{{ publi.link_url }}">{{ publi.link_display }}</a></strong></p>
  <p> {{ publi.news }}</p>
 </div>
</div>

{% assign number_printed = number_printed | plus: 1 %}

{% if even_odd == 1 %}
</div>
{% endif %}

{% endif %}
{% endfor %}

{% assign even_odd = number_printed | modulo: 2 %}
{% if even_odd == 1 %}
</div>
{% endif %}

<p> &nbsp; </p>

## Full List of publications

{% for publi in sorted_publications %}
{% if publi.conference == 0 %}
  {{ publi.title }} <br />
  <em>{{ publi.authors }} </em><br /><a href="{{ publi.link_url }}">{{ publi.link_display }}</a>
{% endif %}
{% endfor %}

## Conference publications

{% for publi in sorted_publications %}
{% if publi.conference == 1 %}
  {{ publi.title }} <br />
  <em>{{ publi.authors }} </em><br /><a href="{{ publi.link_url }}">{{ publi.link_display }}</a>
{% endif %}
{% endfor %}