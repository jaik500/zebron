# Python for AI Engineering
# Lesson 1: Variables and Data Types

student_name = "Alex"
course_name = "Python for AI Engineering"

lessons_completed = 8
total_lessons = 32

is_active = True

completion_percentage = (
    lessons_completed / total_lessons
) * 100

has_reached_halfway = completion_percentage >= 50

print("STUDENT LEARNING REPORT")
print("-----------------------")

print(f"Student: {student_name}")
print(f"Course: {course_name}")
print(f"Lessons completed: {lessons_completed}")
print(f"Total lessons: {total_lessons}")
print(f"Completion: {completion_percentage:.0f}%")
print(f"Active: {is_active}")
print(f"Reached halfway: {has_reached_halfway}")

print("Yo Jaik")
student_name = "YoYo"
print(student_name)



student_name = "Jaik"
student_age = 30
course_progress = 75.5
is_enrolled = True

print(type(student_name))
print(type(student_age))
print(type(course_progress))
print(type(is_enrolled))

student = {
    "name": "Jaik",
    "age": 30,
    "course": "Python for AI Engineering",
    "progress": 75.5,
    "active": True
}

print(student["name"])
print(student["course"])
print(student["progress"])

courses = [
    "Python for AI Engineering",
    "SQL and Data Engineering",
    "Machine Learning"
]

print(courses[0])
print(courses[1])
print(courses[2])

if "Generative AI" in courses:
    print("Course exists")

courses.append("Generative AI")

if "Generative AI" in courses:
    print("Course exists")