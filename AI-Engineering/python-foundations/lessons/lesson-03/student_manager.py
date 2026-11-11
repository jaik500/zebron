pupils = [
    {
        "name": "Yo",
        "email": "yo@mail.com",
        "course": "Cyber",
        "progress": 75.5,
        "is_active": True
    },
     {
        "name": "John",
        "email": "john@mail.com",
        "course": "Maintenance",
        "progress": 40,
        "is_active": True
    },
     {
        "name": "Peter",
        "email": "peter@mail.com",
        "course": "AI Foundation",
        "progress": 5.8,
        "is_active": False
    },
    
]

for pupil in pupils:
    print(pupil["name"])
    print(pupil["email"])
    print(pupil["course"])
    print(pupil["progress"])
    print(pupil["is_active"])

    print("Next Home work")

    progress = 85

if progress >= 70:
    print("Course completed successfully")
else:
    print("Course not completed")