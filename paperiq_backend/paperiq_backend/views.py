from django.shortcuts import render


def render_react(request):
    return render(request, 'index.html')