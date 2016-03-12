import slugify

from django.db import models
from django.contrib.auth.models import User
from django.db.models import Max
from django.db import connection

#from courses.models import ContentPage # prevent circular import

## Feedback models

class ContentFeedbackQuestion(models.Model):
    """A feedback that can be linked to any content."""
    QUESTION_TYPE_CHOICES = (
        ("TEXTFIELD_FEEDBACK", "Textfield feedback"),
        ("THUMB_FEEDBACK", "Thumb feedback"),
        ("STAR_FEEDBACK", "Star feedback"),
    )

    QUESTION_TYPE_ORDERING = {"THUMB_FEEDBACK" : 1, 
                              "STAR_FEEDBACK" : 2, 
                              "TEXTFIELD_FEEDBACK" : 3}

    question = models.CharField(verbose_name="Question", max_length=100, unique=True)
    question_type = models.CharField(max_length=28, default="TEXTFIELD_FEEDBACK", choices=QUESTION_TYPE_CHOICES)
    slug = models.CharField(max_length=255, db_index=True, unique=True)
    
    def __str__(self):
        return self.question

    def get_url_name(self):
        """Creates a URL and HTML5 ID field friendly version of the name."""
        return slugify.slugify(self.question)

    def get_type_object(self):
        type_models = {
            "TEXTFIELD_FEEDBACK" : TextfieldFeedbackQuestion,
            "THUMB_FEEDBACK" : ThumbFeedbackQuestion,
            "STAR_FEEDBACK" : StarFeedbackQuestion,
        }                       
        return type_models[self.question_type].objects.get(id=self.id)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self.get_url_name()
        else:
            self.slug = slugify.slugify(self.slug)

        super(ContentFeedbackQuestion, self).save(*args, **kwargs)

    def save_answer(self, content, user, ip, answer):
        pass

    def get_human_readable_type(self):
        humanized_type = self.question_type.replace("_", " ").lower()
        return humanized_type

    def get_answers_by_content(self, content):
        return ContentFeedbackUserAnswer.objects.filter(question=self, content=content)

    def get_user_answers_by_content(self, user, content):
        return ContentFeedbackUserAnswer.objects.filter(question=self, user=user, content=content)
    
    def get_latest_answer(self, user, content):
        answers = self.get_user_answers_by_content(user, content)
        if answers:
            return answers.latest()
        else:
            return None

    def get_latest_answers_by_content(self, content):
        if connection.vendor == "postgresql":
            return self.get_answers_by_content(content).order_by("user", "-answer_date").distinct("user")
        else:
            users = User.objects.annotate(latest_date=Max("contentfeedbackuseranswer__answer_date"))
            return ContentFeedbackUserAnswer.objects.filter(answer_date__in=[user.latest_date for user in users])

    def user_answered(self, user, content):
        if ContentFeedbackUserAnswer.objects.filter(question=self, user=user, content=content).count() >= 1:
            return True
        else:
            return False
            
    class Meta:
        ordering = ["question_type"]

class TextfieldFeedbackQuestion(ContentFeedbackQuestion):
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self.get_url_name()
        else:
            self.slug = slugify.slugify(self.slug)
        
        self.question_type = "TEXTFIELD_FEEDBACK"
        super(TextfieldFeedbackQuestion, self).save(*args, **kwargs)

    def save_answer(self, content, user, ip, answer):
        if "text-feedback" in answer.keys():
            given_answer = answer["text-feedback"].replace("\r", "")
        else:
            raise InvalidFeedbackAnswerException("Error: failed to read text feedback from the feedback field!")
        
        if not given_answer:
            raise InvalidFeedbackAnswerException("Your answer is missing!")

        answer_object = TextfieldFeedbackUserAnswer(
            question=self, content=content, answer=given_answer, user=user,
            answerer_ip=ip
        )
        answer_object.save()
        return answer_object
        
    def get_answers_by_content(self, content):
        return TextfieldFeedbackUserAnswer.objects.filter(question=self, content=content)

    def get_latest_answers_by_content(self, content):
        if connection.vendor == "postgresql":
            return self.get_answers_by_content(content).order_by("user", "-answer_date").distinct("user")
        else:
            users = User.objects.annotate(latest_date=Max("textfieldfeedbackuseranswer__answer_date"))
            return TextfieldFeedbackUserAnswer.objects.filter(answer_date__in=[user.latest_date for user in users])
        
    def get_user_answers_by_content(self, user, content):
        return TextfieldFeedbackUserAnswer.objects.filter(question=self, user=user, content=content)

    def user_answered(self, user, content):
        if TextfieldFeedbackUserAnswer.objects.filter(question=self, user=user, content=content).count() >= 1:
            return True
        else:
            return False

    class Meta:
        verbose_name = "textfield feedback question"
        proxy = True

class ThumbFeedbackQuestion(ContentFeedbackQuestion):
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self.get_url_name()
        else:
            self.slug = slugify.slugify(self.slug)

        self.question_type = "THUMB_FEEDBACK"
        super(ThumbFeedbackQuestion, self).save(*args, **kwargs)

    def save_answer(self, content, user, ip, answer):
        if "choice" in answer.keys():
            choice = answer["choice"]
        else:
            raise InvalidFeedbackAnswerException("Error: failed to read the selected feedback option!")

        if choice == "up":
            thumb_up = True
        else:
            thumb_up = False

        answer_object = ThumbFeedbackUserAnswer(
            question=self, content=content, thumb_up=thumb_up, user=user,
            answerer_ip=ip
        )
        answer_object.save()
        return answer_object
        
    def get_answers_by_content(self, content):
        return ThumbFeedbackUserAnswer.objects.filter(question=self, content=content)

    def get_latest_answers_by_content(self, content):
        if connection.vendor == "postgresql":
            return self.get_answers_by_content(content).order_by("user", "-answer_date").distinct("user")
        else:
            users = User.objects.annotate(latest_date=Max("thumbfeedbackuseranswer__answer_date"))
            return ThumbFeedbackUserAnswer.objects.filter(answer_date__in=[user.latest_date for user in users])

    def get_user_answers_by_content(self, user, content):
        return ThumbFeedbackUserAnswer.objects.filter(question=self, user=user, content=content)

    def user_answered(self, user, content):
        if ThumbFeedbackUserAnswer.objects.filter(question=self, user=user, content=content).count() >= 1:
            return True
        else:
            return False

    class Meta:
        verbose_name = "thumb feedback question"
        proxy = True

class StarFeedbackQuestion(ContentFeedbackQuestion):
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self.get_url_name()
        else:
            self.slug = slugify.slugify(self.slug)
        
        self.question_type = "STAR_FEEDBACK"
        super(StarFeedbackQuestion, self).save(*args, **kwargs)
    
    def save_answer(self, content, user, ip, answer):
        if "choice" in answer.keys():
            rating = int(answer["choice"])
        else:
            raise InvalidFeedbackAnswerException("Error: failed to read the selected rating!")

        answer_object = StarFeedbackUserAnswer(
            question=self, content=content, rating=rating, user=user,
            answerer_ip=ip
        )
        answer_object.save()
        return answer_object
        
    def get_answers_by_content(self, content):
        return StarFeedbackUserAnswer.objects.filter(question=self, content=content)

    def get_latest_answers_by_content(self, content):
        if connection.vendor == "postgresql":
            return self.get_answers_by_content(content).order_by("user", "-answer_date").distinct("user")
        else:
            users = User.objects.annotate(latest_date=Max("starfeedbackuseranswer__answer_date"))
            return StarFeedbackUserAnswer.objects.filter(answer_date__in=[user.latest_date for user in users])
        
    def get_user_answers_by_content(self, user, content):
        return StarFeedbackUserAnswer.objects.filter(question=self, user=user, content=content)
    
    def user_answered(self, user, content):
        if StarFeedbackUserAnswer.objects.filter(question=self, user=user, content=content).count() >= 1:
            return True
        else:
            return False

    class Meta:
        verbose_name = "star feedback question"
        proxy = True

class ContentFeedbackUserAnswer(models.Model):
    user = models.ForeignKey(User)                          # The user who has given this feedback
    content = models.ForeignKey('courses.ContentPage')      # The content on which this feedback was given
    question = models.ForeignKey(ContentFeedbackQuestion)   # The feedback question this feedback answers
    answerer_ip = models.GenericIPAddressField()
    answer_date = models.DateTimeField(verbose_name='Date and time of when the user answered this feedback question',
                                       auto_now_add=True)
   
class TextfieldFeedbackUserAnswer(ContentFeedbackUserAnswer):
    answer = models.TextField()

    class Meta:
        get_latest_by = "answer_date"
    
class ThumbFeedbackUserAnswer(ContentFeedbackUserAnswer):
    thumb_up = models.BooleanField()
    
    class Meta:
        get_latest_by = "answer_date"

class StarFeedbackUserAnswer(ContentFeedbackUserAnswer):
    rating = models.PositiveSmallIntegerField()
    
    class Meta:
        get_latest_by = "answer_date"

class InvalidFeedbackAnswerException(Exception):
    """
    This exception is cast when a feedback answer cannot be processed.
    """
    pass
