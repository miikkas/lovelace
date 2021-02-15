from django.template import loader
from courses import markupparser
import courses.models as cm


INCORRECT = 0
CORRECT = 1
INFO = 2
ERROR = 3
DEBUG = 4
LINT_C = 10 #10
LINT_R = 11 #11
LINT_W = 12 #12
LINT_E = 13 #13


def render_json_feedback(log, request, course, instance):
    # render all individual messages in the log tree
    triggers = []
    hints = []
    correct = True

    context = {
        "course_slug": course.slug,
        "instance_slug": instance.slug
    }

    for test in log["tests"]:
        test["title"] = "".join(markupparser.MarkupParser.parse(test["title"], request, context)).strip()
        for run in test["runs"]:
            run["correct"] = True
            for output in run["output"]:
                output["msg"] = "".join(markupparser.MarkupParser.parse(output["msg"], request, context)).strip()
                triggers.extend(output.get("triggers", []))
                hints.extend(
                    "".join(markupparser.MarkupParser.parse(msg, request, context)).strip()
                    for msg in output.get("hints", [])
                )
                if output["flag"] in (INCORRECT, ERROR):
                    run["correct"] = False
                    correct = False

        test["runs"].sort(key=lambda run: run["correct"])


    t_messages = loader.get_template('courses/exercise-evaluation-messages.html')
    t_exercise = loader.get_template("courses/exercise-evaluation.html")
    c_exercise = {
        'evaluation': correct
    }
    feedback = {
        "messages": t_messages.render({'log': log["tests"]}),
        "hints": hints,
        "triggers": triggers,
        "result": t_exercise.render(c_exercise)
    }
    return feedback

def update_completion(exercise, instance, user, correct):
    changed = False
    try:
        completion = cm.UserTaskCompletion.objects.get(
            exercise=exercise,
            instance=instance,
            user=user
        )
    except cm.UserTaskCompletion.DoesNotExist:
        completion = cm.UserTaskCompletion(
            exercise=exercise,
            instance=instance,
            user=user
        )
        completion.state = ["incorrect", "correct"][correct]
        completion.save()
        changed = True
    else:
        if completion.state != "correct":
            completion.state = "correct"
            completion.save()
            changed = True
            
    if changed and correct and exercise.evaluation_group:
        others = cm.ContentPage.objects.filter(
            evaluation_group=exercise.evaluation_group
        ).exclude(id=exercise.id)
        for task in others:
            try:
                completion = cm.UserTaskCompletion.objects.get(
                    exercise=task,
                    instance=instance,
                    user=user
                )
            except cm.UserTaskCompletion.DoesNotExist:
                completion = cm.UserTaskCompletion(
                    exercise=task,
                    instance=instance,
                    user=user
                )
                completion.state = "credited"
                completion.save()
            else:
                if completion.state not in ["correct", "credited"]:
                    completion.state = "credited"
                    completion.save()
