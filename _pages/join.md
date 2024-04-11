---
title: "CNDL@IITJ - Join Us!"
layout: textlay
sitemap: false
permalink: /join/
---

# Open positions

We are looking for exceptionally motivated PhD, Masters and **long term** undergraduate students interested in the following research areas:  

computational neuroscience, experimental cognitive neuroscience (EEG), systems biology or dynamics of complex systems  

See below for available projects and positions. Application process is mentioned under each project / opening.

# Internships

**IIT-Jodhpur students**  
You may apply (see bottom of the page) for internships or design credit projects **only if you are committed to completing the internship**. If you have applied for other internship programs, you should let us know up front about it. Faculty invests significant amount of time in interacting with you, thinking about appropriate projects for you and planning for them.  
**Do not expect a recommendation letter if you are going to work with us for under 6 months**.

**Others**  
We do not offer 'unofficial' internships for students not registered at IIT-Jodhpur. If you are interested in an internship, you can check out the official Summer Internship Program run by the School of Artificial Intelligence and Data Science.

You are encouraged to find funding through external programs listed below. Some linke may be outdated, but a quick Google search will get you to the corresponding updated pages.

1. For UGs, teachers: [INSA Summer Research Fellowship Program](https://webjapps.ias.ac.in/fellowship2022/index.html)
1. For faculty: [Summer Faculty Research Fellow Programme](https://cepqip.iitd.ac.in/qip/info.php?id=sfrf)

# Projects and openings

{% assign sorted_projects = site.data.projects | sort: "start-year"  %}

<div class = "col-sm-12" markdown="1">
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
<div id="collapse{{ number_printed }}" class="panel-collapse collapse" markdown="1">
<div class="panel-body">
{{ project.content }}

---
#### Minimum qualifications
{{ project.min-qualifications }}

---
#### Desired skills
{{ project.expected-skills }}

---
#### [Apply here]({{ project.application }}){:target="_blank"}

{% assign number_printed = number_printed | plus: 1 %}
</div> <!--panel-body-->
</div> <!--panel-collapse-->
</div> <!--panel-default-->
{% endif %}

{% endfor %}

</div> <!--panel-group-->
</div> <!-- sm-12 -->

<!-- Latest compiled and minified JavaScript -->
<script src="https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js"></script>
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.4/js/bootstrap.min.js"></script>
