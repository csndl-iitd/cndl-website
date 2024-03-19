---
title: "CNDL@IITJ - Test"
layout: textlay
sitemap: false
permalink: /test/
---

{% assign sorted_projects = site.data.projects | sort: "start-year" | reverse %}

<div class = "container" markdown="1">
<div class="panel-group" id="accordion" markdown="1">

{% assign number_printed = 0 %}
{% for project in sorted_projects %}

{% if project.display == 1 %}
<div class="panel panel-default" markdown="1">
<div class="panel-heading" markdown="1">
<h4 class="panel-title">
<a class="accordion-toggle" data-toggle="collapse" data-parent="#accordion" href='#collapse{{ number_printed }}'>
{{ project.title }} <span style="float:right;"> {{ project.manpower }} ({{ project.start-year }}) </span>
</a>
</h4>
</div>
{% if number_printed==0 %}
<div id="collapse{{ number_printed }}" class="panel-collapse collapse in" markdown="1">
{% else %}
<div id="collapse{{ number_printed }}" class="panel-collapse collapse" markdown="1">
{% endif %}
<div class="panel-body">
{{ project.content }}

---
#### Minimum qualifications
{{ project.min-qualifications }}

---
#### Desired skills
{{ project.expected-skills }}

{% assign number_printed = number_printed | plus: 1 %}
</div> <!--panel-body-->
</div> <!--panel-collapse-->
</div> <!--panel-default-->
{% endif %}

{% endfor %}

</div> <!--panel-group-->
</div> <!-- container -->

<!-- Latest compiled and minified JavaScript -->
<script src="https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js"></script>
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.4/js/bootstrap.min.js"></script>